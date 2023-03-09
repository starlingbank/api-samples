package com.starlingbank;

import static com.starlingbank.SignatureUtils.createAuthorizationHeader;
import static com.starlingbank.SignatureUtils.createDigest;
import static com.starlingbank.SignatureUtils.sign;
import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.SignatureException;
import java.security.spec.InvalidKeySpecException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

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
    UUID apiKeyUid = UUID.fromString(args[0]);
    PrivateKey privateApiKey = KeyUtils.getPrivateKey(args[1], keyFactory);
    SigningAlgorithm signingAlgorithm = SigningAlgorithm.valueOf(args[2]);
    String requestTarget = args[3]; // Should be the HTTP method (lowercase), a space, then the endpoint path e.g. "put /api/v2/payments/local/account/90d14796-c59f-4944-9146-7fc84deb253c/category/46168325-8d23-4efe-ba48-b3a74f85f23b"
    String payload = args[4]; // Should be the raw JSON string e.g. "{"externalIdentifier":"7cb1a2e1-812a-49dc-9399-84f45acaff26","destinationPayeeAccountUid":"db61037a-c9db-40e9-9507-01e932b114eb","reference":"Some reference","amount":{"currency":"GBP","minorUnits":1234}}"
    String accessToken = args[5]; // Should be access token e.g. "eyJhbGciOiJQUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAQ-_pT1TALVKOt8.uLjFJikw--DDv3Pf"

    // Calculate the text to sign
    String date = ISO_OFFSET_DATE_TIME.format(ZonedDateTime.now());
    String digest = createDigest(payload);
    String textToSign = "(request-target): %s\nDate: %s\nDigest: %s".formatted(requestTarget, date, digest);

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
   * Pretty prints headers for console output.
   */
  private static void prettyPrintHeaders(Map<String, String> headers) {
    System.out.println("Attach these headers to your request:");
    headers.forEach((key, value) -> System.out.println(key + ": " + value));
  }
}