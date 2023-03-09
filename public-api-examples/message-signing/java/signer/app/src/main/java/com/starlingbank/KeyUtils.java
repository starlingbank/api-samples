package com.starlingbank;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

class KeyUtils {
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