---
slug: 3.8/api/classes/invalid-filter-operator-value-error
title: "InvalidFilterOperatorValueError"
---

Defined in: [src/lib/errors/invalid-filter-operator-value.error.ts:18](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/invalid-filter-operator-value.error.ts#L18)

Thrown when a filter operator receives a value array of the wrong shape

Some operators have arity or type constraints that the library enforces
at call time so misuse fails loudly instead of silently emitting invalid
server requests:

- `BTW` requires exactly two values (min, max).
- `NULL` requires exactly one boolean value (`true` for `IS NULL`,
  `false` for `IS NOT NULL`).

Operators with looser shape rules leave validation to the server; this
error is reserved for cases where the library itself can detect the
problem unambiguously from the call site.

## Extends

- `Error`

## Constructors

### Constructor

> **new InvalidFilterOperatorValueError**(`operator`, `reason`): `InvalidFilterOperatorValueError`

Defined in: [src/lib/errors/invalid-filter-operator-value.error.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/invalid-filter-operator-value.error.ts#L24)

#### Parameters

##### operator

[`FilterOperatorEnum`](/3.8/api/enumerations/filter-operator-enum/)

The operator that rejected the values

##### reason

`string`

Short human-readable explanation of the constraint

#### Returns

`InvalidFilterOperatorValueError`

#### Overrides

`Error.constructor`

## Properties

### message

> **message**: `string`

Defined in: typescript/lib/lib.es5.d.ts:1075

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

Defined in: typescript/lib/lib.es5.d.ts:1074

#### Inherited from

`Error.name`

***

### stack?

> `optional` **stack?**: `string`

Defined in: typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.stack`
