import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;

class StarlingMessageSigner {

  public static void main(String[] args) throws NoSuchAlgorithmException, InvalidKeyException, SignatureException, IOException, InvalidKeySpecException {
    if (args.length != 6) {
      System.err.println("Expected 6 arguments but got " + args.length);
      System.out.println("Usage: java StarlingMessageSigner <apiKeyUid> <privateApiKey> <signingAlgorithm> <requestTarget> <payload> <accessToken>");
      System.out.println("Where:");
      System.out.println("- apiKeyUid is the key uid for the API key, you can get this from Developer Portal e.g. \"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa\"");
      System.out.println("- privateApiKey is the filename of the corresponding private API key e.g. \"starling-api-private.key\"");
      System.out.println("- signingAlgorithm is one of " + Arrays.toString(SigningAlgorithm.values()));
      System.out.println("- requestTarget is the HTTP method (lowercase), a space, then the endpoint path e.g. \"put /api/v2/payments/local/account/90d14796-c59f-4944-9146-7fc84deb253c/category/46168325-8d23-4efe-ba48-b3a74f85f23b\"");
      System.out.println("- payload is the raw JSON string e.g. \"{\"externalIdentifier\":\"7cb1a2e1-812a-49dc-9399-84f45acaff26\"}\"");
      System.out.println("- accessToken is an access token e.g. \"eyJhbGciOiJQUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAQ-_pT1TALVKOt8.uLjFJikw--DDv3Pf\"");
      System.out.println("You may need to surround the arguments in quotes, and escape any inner quotes");
      return;
    }

    // Parse command line arguments
    KeyFactory keyFactory = KeyFactory.getInstance(args[2].startsWith("ECDSA") ? "EC" : "RSA");
    String apiKeyUid = args[0];
    PrivateKey privateApiKey = KeyUtils.getPrivateKey(args[1], keyFactory);
    SigningAlgorithm signingAlgorithm = SigningAlgorithm.valueOf(args[2]);
    String requestTarget = args[3]; // Should be the HTTP method (lowercase), a space, then the endpoint path e.g. "put /api/v2/payments/local/account/90d14796-c59f-4944-9146-7fc84deb253c/category/46168325-8d23-4efe-ba48-b3a74f85f23b"
    String payload = args[4]; // Should be the raw JSON string e.g. "{"externalIdentifier":"7cb1a2e1-812a-49dc-9399-84f45acaff26","destinationPayeeAccountUid":"db61037a-c9db-40e9-9507-01e932b114eb","reference":"Some reference","amount":{"currency":"GBP","minorUnits":1234}}"
    String accessToken = args[5]; // Should be access token e.g. "eyJhbGciOiJQUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAQ-_pT1TALVKOt8.uLjFJikw--DDv3Pf"

    // Calculate the text to sign
    String date = ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    String digest = createDigest(payload);
    String textToSign = String.format("(request-target): %s\nDate: %s\nDigest: %s", requestTarget, date, digest);

    // Sign the text
    String signature = sign(privateApiKey, signingAlgorithm, textToSign);

    // Create the authorization header
    String authorizationHeader = createAuthorizationHeader(accessToken, apiKeyUid, signingAlgorithm, signature);

    // These are the headers you need to send with your request
    Map<String, String> headers = Map.of(
        "Authorization", authorizationHeader,
        "Digest", digest,
        "Date", date
    );

    prettyPrintHeaders(headers);
  }

  /**
   * Creates a Base64 SHA-512 digest of the input.
   * @param payload Input payload
   * @return Base64 encoded SHA-512 digest
   */
  private static String createDigest(String payload) throws NoSuchAlgorithmException {
    return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-512").digest(payload.getBytes()));
  }

  /**
   * Calculate the signature for some text, encoded as base 64.
   * @param privateKey Private key to sign the text with
   * @param signingAlgorithm The signing algorithm to use
   * @param textToSign The text you want signed
   * @return Base64 encoded signature
   */
  private static String sign(PrivateKey privateKey, SigningAlgorithm signingAlgorithm, String textToSign) throws NoSuchAlgorithmException, InvalidKeyException, SignatureException {
    Signature signature = Signature.getInstance(signingAlgorithm.javaName);
    signature.initSign(privateKey);
    signature.update(textToSign.getBytes());
    return new String(Base64.getEncoder().encode(signature.sign()));
  }

  /**
   * Generates the 'Authorization' HTTP header.
   */
  private static String createAuthorizationHeader(String accessToken, String keyUid, SigningAlgorithm signingAlgorithm, String signature) {
    return String.format(
        "Bearer %s;Signature keyid=\"%s\",algorithm=\"%s\",headers=\"(request-target) Date Digest\",signature=\"%s\"",
        accessToken,
        keyUid,
        signingAlgorithm.starlingName,
        signature
    );
  }

  /**
   * Pretty prints headers for console output.
   */
  private static void prettyPrintHeaders(Map<String, String> headers) {
    System.out.println("Attach these headers to your request:");
    headers.forEach((key, value) -> System.out.println(key + ": " + value));
  }

  /**
   * A signing algorithm, with a name for putting in the header of a request to Starling, and name for getting a Signature instance in Java.
   */
  enum SigningAlgorithm {
    RSA_SHA256("rsa-sha256", "SHA256withRSA"),
    RSA_SHA512("rsa-sha512", "SHA512withRSA"),
    ECDSA_SHA256("ecdsa-sha256", "SHA256withECDSA"),
    ECDSA_SHA512("ecdsa-sha512", "SHA512withECDSA");

    private String starlingName;
    private String javaName;

    SigningAlgorithm(String starlingName, String javaName) {
      this.starlingName = starlingName;
      this.javaName = javaName;
    }
  }

  private static class KeyUtils {
    /**
     * Generates a random RSA key pair, for demonstration purposes.
     * @return Key pair
     */
    public static KeyPair getKeyPair() {
      try {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(4096);
        return keyPairGenerator.generateKeyPair();
      } catch (NoSuchAlgorithmException e) {
        throw new RuntimeException("Failed to generate example key", e);
      }
    }

    /**
     * Gets key pair from file.
     * @param baseFileName Path to file, excluding `-public.key`/`-private.key` suffix
     * @param algorithm Key algorithm, probably "RSA" or "EC"
     * @return Key pair
     */
    public static KeyPair getKeyPair(String baseFileName, String algorithm) throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
      KeyFactory keyFactory = KeyFactory.getInstance(algorithm);
      return new KeyPair(getPublicKey(baseFileName + "-public.key", keyFactory), getPrivateKey(baseFileName + "-private.key", keyFactory));
    }

    /**
     * Gets public key from file.
     * @param fileName Path to file public key file
     * @param keyFactory Key factory to parse this key
     * @return Public key
     */
    public static PublicKey getPublicKey(String fileName, KeyFactory keyFactory) throws IOException, InvalidKeySpecException {
      return keyFactory.generatePublic(new X509EncodedKeySpec(stripHeaders(Files.readAllBytes(Paths.get(fileName)))));
    }

    /**
     * Gets private key from file.
     * @param fileName Path to file private key file
     * @param keyFactory Key factory to parse this key
     * @return Private key
     */
    public static PrivateKey getPrivateKey(String fileName, KeyFactory keyFactory) throws IOException, InvalidKeySpecException {
      return keyFactory.generatePrivate(new PKCS8EncodedKeySpec(stripHeaders(Files.readAllBytes(Paths.get(fileName)))));
    }

    private static byte[] stripHeaders(byte[] rawKey) {
      return Base64.getDecoder().decode(new String(rawKey)
          .replace("-----BEGIN PRIVATE KEY-----", "")
          .replace("-----END PRIVATE KEY-----", "")
          .replace("-----BEGIN PUBLIC KEY-----", "")
          .replace("-----END PUBLIC KEY-----", "")
          .replaceAll("\\s",""));
    }
  }
}