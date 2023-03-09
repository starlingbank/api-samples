package com.starlingbank;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.Signature;
import java.util.Base64;
import java.util.UUID;

class SignatureUtils {

  /**
   * Creates a Base64 SHA-512 digest of the input.
   *
   * @param payload Input payload
   * @return Base64 encoded SHA-512 digest
   */
  static String createDigest(String payload) {
    try {
      return Base64.getEncoder().encodeToString(
          MessageDigest.getInstance("SHA-512").digest(payload.getBytes())
      );
    } catch (NoSuchAlgorithmException nsae) {
      throw new RuntimeException(nsae);
    }
  }

  /**
   * Generates the 'Authorization' HTTP header.
   */
  static String createAuthorizationHeader(String accessToken, UUID keyUid, SigningAlgorithm signingAlgorithm, String signature) {
    return "Bearer %s;Signature keyid=\"%s\",algorithm=\"%s\",headers=\"(request-target) Date Digest\",signature=\"%s\""
        .formatted(accessToken, keyUid, signingAlgorithm.starlingName(), signature);
  }

  /**
   * Calculate the signature for some text, encoded as base 64.
   *
   * @param privateKey Private key to sign the text with
   * @param textToSign The text you want signed
   * @return Base64 encoded signature
   */
  static String sign(PrivateKey privateKey, SigningAlgorithm signingAlgorithm, String textToSign) {
    try {
      Signature signature = Signature.getInstance(signingAlgorithm.javaName());
      signature.initSign(privateKey);
      signature.update(textToSign.getBytes());
      return Base64.getEncoder().encodeToString(signature.sign());
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
