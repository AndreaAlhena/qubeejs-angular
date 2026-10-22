---
slug: 3.8/api/enumerations/filter-operator-enum
title: "FilterOperatorEnum"
---

Defined in: [src/lib/enums/filter-operator.enum.ts:18](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L18)

Enum representing the available filter operators for explicit operator
filters

NestJS encodes these with the `$` prefix at the wire level
(`filter.field=$operator:value`); PostgREST translates them to its own
prefix notation (`col=eq.val`, `col=is.null`, etc.). The enum values are
intentionally the NestJS form; each driver's request strategy is
responsible for mapping them into its own shape.

`FTS`, `PLFTS`, `PHFTS`, `WFTS` are PostgREST-native full-text search
variants; they throw `UnsupportedFilterOperatorError` on every other
driver that does not recognise them.

## See

 - https://github.com/ppetzold/nestjs-paginate
 - https://postgrest.org/en/stable/api.html#operators

## Enumeration Members

### BTW

> **BTW**: `"$btw"`

Defined in: [src/lib/enums/filter-operator.enum.ts:19](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L19)

***

### CONTAINS

> **CONTAINS**: `"$contains"`

Defined in: [src/lib/enums/filter-operator.enum.ts:20](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L20)

***

### EQ

> **EQ**: `"$eq"`

Defined in: [src/lib/enums/filter-operator.enum.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L21)

***

### FTS

> **FTS**: `"$fts"`

Defined in: [src/lib/enums/filter-operator.enum.ts:22](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L22)

***

### GT

> **GT**: `"$gt"`

Defined in: [src/lib/enums/filter-operator.enum.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L23)

***

### GTE

> **GTE**: `"$gte"`

Defined in: [src/lib/enums/filter-operator.enum.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L24)

***

### ILIKE

> **ILIKE**: `"$ilike"`

Defined in: [src/lib/enums/filter-operator.enum.ts:25](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L25)

***

### IN

> **IN**: `"$in"`

Defined in: [src/lib/enums/filter-operator.enum.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L26)

***

### LT

> **LT**: `"$lt"`

Defined in: [src/lib/enums/filter-operator.enum.ts:27](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L27)

***

### LTE

> **LTE**: `"$lte"`

Defined in: [src/lib/enums/filter-operator.enum.ts:28](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L28)

***

### NOT

> **NOT**: `"$not"`

Defined in: [src/lib/enums/filter-operator.enum.ts:29](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L29)

***

### NULL

> **NULL**: `"$null"`

Defined in: [src/lib/enums/filter-operator.enum.ts:30](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L30)

***

### PHFTS

> **PHFTS**: `"$phfts"`

Defined in: [src/lib/enums/filter-operator.enum.ts:31](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L31)

***

### PLFTS

> **PLFTS**: `"$plfts"`

Defined in: [src/lib/enums/filter-operator.enum.ts:32](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L32)

***

### SW

> **SW**: `"$sw"`

Defined in: [src/lib/enums/filter-operator.enum.ts:33](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L33)

***

### WFTS

> **WFTS**: `"$wfts"`

Defined in: [src/lib/enums/filter-operator.enum.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/enums/filter-operator.enum.ts#L34)
