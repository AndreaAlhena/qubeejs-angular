---
slug: 3.8/api/classes/unsupported-filter-error
title: "UnsupportedFilterError"
---

Defined in: [src/lib/errors/unsupported-filter.error.ts:6](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-filter.error.ts#L6)

Error thrown when filters are attempted with a driver that does not support them

Filters are only supported by the Spatie and NestJS drivers.

## Extends

- `Error`

## Constructors

### Constructor

> **new UnsupportedFilterError**(): `UnsupportedFilterError`

Defined in: [src/lib/errors/unsupported-filter.error.ts:7](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-filter.error.ts#L7)

#### Returns

`UnsupportedFilterError`

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
