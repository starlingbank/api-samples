package com.starlingbank;

import static spark.Spark.awaitInitialization;
import static spark.Spark.get;
import static spark.Spark.halt;
import static spark.Spark.path;
import static spark.Spark.port;
import static spark.Spark.post;
import static spark.Spark.put;
import static spark.Spark.threadPool;

import com.google.common.base.Joiner;
import com.google.common.base.Splitter;
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Sets;
import java.io.File;
import java.nio.charset.Charset;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.security.spec.EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.SortedSet;
import java.util.stream.Collectors;
import org.apache.commons.io.FileUtils;
import spark.Request;
import spark.Response;

public class StarlingMessageSignatureValidator {

  private static final String[] ACCEPTED_ALGORITHMS = {"rsa-sha256", "rsa-sha512", "ecdsa-sha256", "ecdsa-sha512"};
  private static final ImmutableList<String> REQUIRED_HEADERS = ImmutableList
      .of("date", "digest", "(request-target)");

  // BEGIN USER CONFIG
  private static final int port = 30000;
  private static final int maxThreads = 8;
  private static final int minThreads = 2;
  private static final int timeOutMillis = 30000;

  // The path to the Public Key used to sign the request
  private static final String publicKeyPath = "starling-api-public.key";
  // END USER CONFIG

  public static void main(String[] args) {

    // Prep Public Key from File Path - This step is for the purposes of this tool only
    // and would otherwise rely on the keyid supplied in the request AuthHeader for retrieval.
    PublicKey publicKey = getPublicKey();

    if (publicKey != null) {
      // Start up and configure the web server
      port(port);
      threadPool(maxThreads, minThreads, timeOutMillis);

      path("/", () -> {
        get("/*", (request, response) -> processRequest(request, response, publicKey));

        post("/*", (request, response) -> processRequest(request, response, publicKey));

        put("/*", (request, response) -> processRequest(request, response, publicKey));
      });

      awaitInitialization(); // Wait for server to be initialized

      System.out.println("Server listening on: http://localhost:" + port + "/");
    }
  }

  private static String processRequest(Request request, Response response, PublicKey publicKey)
      throws NoSuchAlgorithmException, InvalidKeyException, SignatureException {
    List<String> responseBody = new ArrayList<>();

    // Build the (request-target) value, noting that this excludes the hostname but does include any query parameters if present.
    String requestPath = Strings.isNullOrEmpty(request.queryString()) ?
        request.requestMethod().toLowerCase() + " " + request.uri() :
        request.requestMethod().toLowerCase() + " " + request.uri() + "?" + request.queryString();

    System.out.println("New request received from: " + request.host());
    System.out.println("(request-target): " + requestPath);
    System.out.println("Headers: " + request.headers());
    System.out.println("Body: " + request.body());

    // Get the Authorization header and split into required elements.
    // Note that for the purposes of this tool we are simplifying this process as we do not require the
    // Bearer token or the keyid, though both of these elements are necessary for requests to the Starling API.
    Map<String, String> authorisationHeaders = mapAuthorisationHeaders(request);

    // Parse the Authorization Header to get required sub elements.
    String algorithm = getHeader("algorithm", authorisationHeaders);
    String signature = getHeader("signature", authorisationHeaders);
    String headers = getHeader("headers", authorisationHeaders);

    // Check that the "headers" element from the Authorization header contains all the required elements (Date, Digest and (request-target).
    List<String> headersList = Splitter.on(" ").splitToList(headers.toLowerCase());
    if (!headersList.containsAll(REQUIRED_HEADERS)) {
      SortedSet<String> missingHeaders = Sets.newTreeSet(REQUIRED_HEADERS);
      missingHeaders.removeAll(headersList);
      responseBody.add(
          "Validation failure: authHeader is missing some required headers: " + Joiner.on(", ")
              .join(missingHeaders) + "\n");
    }

    // For non-GET requests, verify that the Message Digest supplied in the request headers matches the body payload.
    if (!request.requestMethod().equalsIgnoreCase("GET")) {
      String payloadDigest = Base64.getEncoder()
          .encodeToString(MessageDigest.getInstance("SHA-512").digest(request.bodyAsBytes()));
      if (request.headers("Digest").equals(payloadDigest)) {
        responseBody.add("Successfully verified digest against payload.\n");
      } else {
        responseBody.add("Digest could not be verified against payload.\n");
      }
    }

    // Get the values for each of the signed headers listed in the Authorization header and build into a single string for verification of the Signature.
    String signingString = getSigningString(request, requestPath, headers);

    // Carry out the signature validation checks.
    String validationChecks = Joiner.on("\n")
        .join(validateSignature(publicKey, algorithm, signingString, signature));

    String responseString = Joiner.on("\n").join(responseBody);
    response.type("text/xml");

    return Joiner.on("\n").join(responseString, validationChecks);
  }

  private static List<String> validateSignature(PublicKey publicKey, String algorithm, String headers,
      String signature)
      throws NoSuchAlgorithmException, InvalidKeyException, SignatureException {
    List<String> verificationChecks = new ArrayList<>();

    // Prep algorithm by establishing the Java name, e.g. "rsa-sha256" = "SHA256withRSA";
    String javaAlgorithm = null;
    try {
      javaAlgorithm = getJavaAlgorithm(algorithm);
    } catch (NoSuchAlgorithmException e) {
      e.printStackTrace();
      halt(400,
          "ERROR: Unsupported signing algorithm, " + algorithm + ". Expected one of: " + Arrays
              .toString(ACCEPTED_ALGORITHMS));
    }

    // Prep Signature object using publicKey and headers
    Signature sig = Signature.getInstance(javaAlgorithm);
    byte[] decodedSignature = Base64.getDecoder()
        .decode(signature.getBytes(Charset.defaultCharset()));
    sig.initVerify(publicKey);
    sig.update(headers.getBytes());

    verificationChecks.add("algorithm: " + algorithm + " -> " + javaAlgorithm);
    verificationChecks.add("headers: " + headers.replaceAll("\n", " "));
    verificationChecks.add("signature: " + signature + "\n");

    // Verify the signature against the signed string.
    try {
      if (sig.verify(decodedSignature)) {
        verificationChecks.add("Message signed correctly.");
      } else {
        verificationChecks.add("Message signature invalid.");
      }
    } catch (SignatureException e) {
      e.printStackTrace();
      halt(400, "Error while processing signature, please see server console for more details.");
    }
    return verificationChecks;
  }

  private static String getJavaAlgorithm(String algorithm) throws NoSuchAlgorithmException {
    return switch (algorithm) {
      case "rsa-sha256" -> "SHA256withRSA";
      case "ecdsa-sha256" -> "SHA256withECDSA";
      case "rsa-sha512" -> "SHA512withRSA";
      case "ecdsa-sha512" -> "SHA512withECDSA";
      default -> throw new NoSuchAlgorithmException(
          String.format("UNSUPPORTED_SIGNING_ALGORITHM %s, expected one of: %s", algorithm,
              Arrays.toString(ACCEPTED_ALGORITHMS)));
    };
  }

  private static Map<String, String> mapAuthorisationHeaders(Request request) {
    Map<String, String> headerMap = null;
    try {
      String authHeader = request.headers("Authorization");
      headerMap = Splitter.on(',')
          .withKeyValueSeparator(Splitter.on('=').limit(2))
          .split(authHeader);
    } catch (Exception e) {
      System.err
          .println("ERROR: Could not process Authorization header, aborting validation check.");
      halt(400, "ERROR: Could not process Authorization header, aborting validation check.");
    }
    return headerMap;
  }

  private static String getSigningString(Request request, String requestPath, String headers) {
    List<String> lines = Splitter.on(" ").splitToList(headers).stream()
        .map(header -> {
          String value = header.equals("(request-target)") ? requestPath : request.headers(header);
          return header + ": " + value;
        })
        .collect(Collectors.toList());
    return Joiner.on("\n").join(lines);
  }

  private static String getHeader(String header, Map<String, String> headerMap) {
    try {
      String test = headerMap.get(header).replace("\"", "");
      if (test.equals("")) {
        System.err.println(
            "Error parsing Authorization header, could not find required element: " + header);
      }
      return test.trim();
    } catch (Exception e) {
      System.err.println(
          "Error parsing Authorization header, could not find required element: " + header);
      return "";
    }
  }

  private static PublicKey getPublicKey() {
    try {
      File publicKeyFile = new File(publicKeyPath);
      System.out.println("Looking for publicKey file in:");
      System.out.println(publicKeyFile.getAbsolutePath() + "\n");

      byte[] publicKeyBytes = FileUtils.readFileToByteArray(publicKeyFile);
      String publicKeyContent = new String(publicKeyBytes)
          .replaceAll("\\n", "")
          .replace("-----BEGIN PUBLIC KEY-----", "")
          .replace("-----END PUBLIC KEY-----", "");

      EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(
          Base64.getMimeDecoder().decode(publicKeyContent));
      KeyFactory keyFactory = KeyFactory.getInstance("RSA");

      return keyFactory.generatePublic(publicKeySpec);

    } catch (Exception e) {
      System.err.println(
          "ERROR: Could not process Public Key, please check pre-configured publicKeyPath.");
      e.printStackTrace();
    }
    return null;
  }
}
