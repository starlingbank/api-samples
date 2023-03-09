package com.starlingbank;

/**
 * A signing algorithm, with a name for putting in the header of a request to Starling, and name for getting a Signature instance in Java.
 */
enum SigningAlgorithm {
  RSA_SHA256("rsa-sha256", "SHA256withRSA"),
  RSA_SHA512("rsa-sha512", "SHA512withRSA"),
  ECDSA_SHA256("ecdsa-sha256", "SHA256withECDSA"),
  ECDSA_SHA512("ecdsa-sha512", "SHA512withECDSA");

  private final String starlingName;
  private final String javaName;

  SigningAlgorithm(String starlingName, String javaName) {
    this.starlingName = starlingName;
    this.javaName = javaName;
  }

  public String starlingName() {
    return starlingName;
  }

  public String javaName() {
    return javaName;
  }
}