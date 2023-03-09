package com.starlingbank;

import com.starlingbank.StarlingApiClient.RequestFailureException;
import com.starlingbank.dto.Account;
import com.starlingbank.dto.Amount;
import com.starlingbank.dto.Payee;
import com.starlingbank.dto.Payee.PayeeAccount;
import com.starlingbank.dto.PaymentInitiationResponse;
import com.starlingbank.dto.PaymentRequest;
import java.util.UUID;

class InitiatePersonalAccessPayment {

  /**
   * Create a Personal Access Token (PAT) & a signing key in Developer Portal then paste the relevant
   * values below. The PAT will require scopes payee:read, account:read & pay-local:create.
   * <p>
   * There is guidance on how to generate tokens and keys in our <a href="https://developer.starlingbank.com/docs">documentation</a>.
   */

  private static final String ACCESS_TOKEN = "eyJhbGciOiJQUzI1NiIsInppcCI6IkdaSVAifQ....";
  private static final String PRIVATE_KEY_FILE = "starling-api-private.key";
  private static final UUID KEY_UID = UUID.fromString("aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa");

  public static void main(String[] args) throws RequestFailureException {

    StarlingApiClient client = new StarlingApiClient(ACCESS_TOKEN, PRIVATE_KEY_FILE, KEY_UID);

    Account sourceAccount = client.getPrimaryGbpAccount();
    Payee payee = client.findPayee("Joe Bloggs")
        .orElseThrow(() -> new RuntimeException("Could not find matching payee"));
    PayeeAccount payeeAccount = payee.accounts().stream()
        .filter(pa -> pa.defaultAccount() && pa.countryCode().equals("GB") && pa.payeeChannelType().equals("BANK_ACCOUNT"))
        .findFirst().orElseThrow(() -> new RuntimeException("Could not find suitable payee account"));

    String externalId = UUID.randomUUID().toString();
    PaymentRequest request = new PaymentRequest(externalId, payeeAccount.payeeAccountUid(), externalId.substring(0, 18), new Amount("GBP", 1_03));

    PaymentInitiationResponse response = client.initiatePayment(sourceAccount, request);
    System.out.println(response);
  }

}