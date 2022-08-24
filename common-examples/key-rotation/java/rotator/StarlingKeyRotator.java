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
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;

class StarlingKeyRotator {

  public static void main(String[] args) throws NoSuchAlgorithmException, InvalidKeyException, SignatureException, IOException, InvalidKeySpecException {
    if (args.length != 4) {
      System.err.println("Expected 4 arguments but got " + args.length);
      System.out.println("Usage: java StarlingKeyRotator <rotationKeyUid> <privateRotationKey> <publicApiKey> <signingAlgorithm>");
      System.out.println("Where:");
      System.out.println("- rotationKeyUid is the key uid for the rotation key, you can get this from Developer Portal e.g. \"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa\"");
      System.out.println("- privateRotationKey is the filename of the private rotation key e.g. \"starling-rotation-private.key\"");
      System.out.println("- publicApiKey is the filename of the public API key you want to upload e.g. \"starling-api-public.key\"");
      System.out.println("- signingAlgorithm is one of " + Arrays.toString(SigningAlgorithm.values()));
      System.out.println("You may need to surround the arguments in quotes, and escape any inner quotes");
      return;
    }

    // Parse command line arguments
    KeyFactory keyFactory = KeyFactory.getInstance(args[3].startsWith("ECDSA") ? "EC" : "RSA");
    String rotationKeyUid = args[0];
    PrivateKey privateRotationKey = KeyUtils.getPrivateKey(args[1], keyFactory);
    PublicKey publicApiKey = KeyUtils.getPublicKey(args[2], keyFactory);
    SigningAlgorithm signingAlgorithm = SigningAlgorithm.valueOf(args[3]);

    // Calculate the text to sign
    String payload = Base64.getEncoder().encodeToString(publicApiKey.getEncoded());
    String date = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    String digest = createDigest(payload);
    String textToSign = String.format("Date: %s\nDigest: %s", date, digest);

    // Sign the text
    String signature = sign(privateRotationKey, signingAlgorithm, textToSign);

    // Create the full upload signature string
    String uploadSignature = createUploadSignature(rotationKeyUid, signingAlgorithm, signature);

    System.out.println("The details for your key rotation upload (valid for up to 5 minutes) are:");
    System.out.println("\nAPI Key:");
    System.out.println(payload);
    System.out.println("\nUpload Signature:");
    System.out.println(uploadSignature);
    System.out.println("\nSignature Timestamp:");
    System.out.println(date);
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
   * Generates the upload signature.
   */
  private static String createUploadSignature(String keyUid, SigningAlgorithm signingAlgorithm, String signature) {
    return String.format(
        "Signature keyid=\"%s\",algorithm=\"%s\",headers=\"(request-target) Date Digest\",signature=\"%s\"",
        keyUid,
        signingAlgorithm.starlingName,
        signature
    );
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