package com.starlingbank.dto;

import java.util.List;
import java.util.UUID;

public record Payee(
    UUID payeeUid,
    String payeeName,
    List<PayeeAccount> accounts
) {

  public record PayeeAccount(
      UUID payeeAccountUid,
      String payeeChannelType,
      boolean defaultAccount,
      String countryCode
  ) {}
}
