---
slug: 3.8/api/enumerations/pagination-mode-enum
title: "PaginationModeEnum"
---

Defined in: [src/lib/enums/pagination-mode.enum.ts:13](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/pagination-mode.enum.ts#L13)

Enum representing the wire-level pagination mechanism

`QUERY` (default) — the request strategy emits `limit` and `offset` (or
equivalent) query parameters on the URL.

`RANGE` — the request strategy omits URL-based pagination and the
consumer instead applies HTTP request headers returned by
`NgQubeeService.paginationHeaders()`. Currently honoured only by the
PostgREST driver, which maps it to `Range-Unit: items` + `Range: 0-9`.
Other drivers ignore the setting.

## Enumeration Members

### QUERY

> **QUERY**: `"query"`

Defined in: [src/lib/enums/pagination-mode.enum.ts:14](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/pagination-mode.enum.ts#L14)

***

### RANGE

> **RANGE**: `"range"`

Defined in: [src/lib/enums/pagination-mode.enum.ts:15](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/pagination-mode.enum.ts#L15)
