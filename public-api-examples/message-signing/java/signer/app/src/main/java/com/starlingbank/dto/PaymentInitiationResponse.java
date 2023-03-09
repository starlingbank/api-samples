package com.starlingbank.dto;

import java.util.UUID;

public record PaymentInitiationResponse(
    UUID paymentOrderUid,
    ConsentInformation consentInformation
) {
  record ConsentInformation(
      String approvalType,
      UUID consentUid
  ) {}
}
