package com.starlingbank.dto;

import java.util.UUID;

public record PaymentRequest(
    String externalIdentifier,
    UUID destinationPayeeAccountUid,
    String reference,
    Amount amount
) {}
