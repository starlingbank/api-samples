package com.starlingbank.dto;

import java.util.UUID;

public record Account(
    UUID accountUid,
    UUID defaultCategory,
    String accountType,
    String currency
) {}
