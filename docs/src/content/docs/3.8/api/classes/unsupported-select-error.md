---
slug: 3.8/api/classes/unsupported-select-error
title: "UnsupportedSelectError"
---

Defined in: [src/lib/errors/unsupported-select.error.ts:7](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-select.error.ts#L7)

Error thrown when flat field selection is attempted with a driver that does not support it

Flat field selection is only supported by the NestJS driver.
Use `addFields()` for Spatie per-model field selection.

## Extends

- `Error`

## Constructors

### Constructor

> **new UnsupportedSelectError**(): `UnsupportedSelectError`

Defined in: [src/lib/errors/unsupported-select.error.ts:8](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-select.error.ts#L8)

#### Returns

`UnsupportedSelectError`

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
