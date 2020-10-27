package com.starlingbank;

public class Mainline {

  public static void main(String[] args) throws Exception {
    // 1. Set the file paths in the constants of SigningExample class then run this first to create a key pair
    new SigningExample().generateKeyForPortal();

    // 2. Upload the key to the SPS portal then complete the key uid, payment business uid and assigned sort code constants of SigningExample

    // 3. Run get for the business to verify key upload / request signing
    // new SigningExample().httpGetExample();

    // 4. Run to create an account for the business, set the account uid constant in SigningExample based on response
    // new SigningExample().httpPutExampleAccount();

    // 5. Run to create an address for the account created above, set the address uid constant in SigningExample based on response
    // new SigningExample().httpPutExampleAddress();

    // 6. Run to instruct a payment from the address created above
    // new SigningExample().httpPutExamplePayment();
  }
}
