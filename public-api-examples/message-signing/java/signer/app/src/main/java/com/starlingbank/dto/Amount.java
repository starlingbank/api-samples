package com.starlingbank.dto;

public record Amount(
    String currency,
    long minorUnits
) {
}
