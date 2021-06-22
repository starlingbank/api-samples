package com.starlingbank;

import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

public class KeySigningExample {

  private static final String HEADER_PREFIX = "Signature ";

  public KeyAndSignature signPaymentsPublicKeyWithUploadPrivateKey(UUID uploadKeyUid, PrivateKey uploadPrivateKey, PublicKey paymentPublicKey, ZonedDateTime uploadTime) {
    try {
      String newEncodedKeyPayload = new String(Base64.getEncoder().encode(paymentPublicKey.getEncoded()));
      String currentDateAsString = uploadTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

      MessageDigest messageDigest = MessageDigest.getInstance("SHA-512");
      String newKeySha512Digest = Base64.getEncoder().encodeToString(messageDigest.digest(newEncodedKeyPayload.getBytes()));

      String uploadStringToSign = "Date: " + currentDateAsString + "\nDigest: " + newKeySha512Digest;

      Signature instance = Signature.getInstance("SHA512withRSA");
      instance.initSign(uploadPrivateKey);
      instance.update(uploadStringToSign.getBytes());
      byte[] encodedSignedString = Base64.getEncoder().encode(instance.sign());
      String signature = new String(encodedSignedString);

      return new KeyAndSignature(newEncodedKeyPayload, toSignature(uploadKeyUid, "rsa-sha512", Arrays.asList("Date","Digest"), signature));
    } catch (NoSuchAlgorithmException | InvalidKeyException | SignatureException e) {
      throw new RuntimeException("Error signing upload", e);
    }
  }

  private String toSignature(UUID uploadKeyUid, String algorithm, List<String> headers, String signature) {
    return
        HEADER_PREFIX +
            keyValue("keyid", uploadKeyUid.toString()) + "," +
            keyValue("algorithm", algorithm) + "," +
            keyValue("headers", String.join(" ", headers)) + "," +
            keyValue("signature", signature);
  }

  private String keyValue(String key, String value) {
    return String.format("%s=\"%s\"", key, value);
  }

  public static class KeyAndSignature {
    private final String publicKey;
    private final String signature;

    public KeyAndSignature(String publicKey, String signature) {
      this.publicKey = publicKey;
      this.signature = signature;
    }

    public String getPublicKey() {
      return publicKey;
    }

    public String getSignature() {
      return signature;
    }
  }
}
