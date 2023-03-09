package com.starlingbank.dto;

import java.util.List;

public record AccountsResponse(
    List<Account> accounts
) {}
