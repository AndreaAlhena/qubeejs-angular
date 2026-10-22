---
slug: 3.8/api/classes/unsupported-field-selection-error
title: "UnsupportedFieldSelectionError"
---

Defined in: [src/lib/errors/unsupported-field-selection.error.ts:7](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-field-selection.error.ts#L7)

Error thrown when per-model field selection is attempted with a driver that does not support it

Per-model field selection is only supported by the Spatie driver.
Use `addSelect()` for NestJS flat field selection.

## Extends

- `Error`

## Constructors

### Constructor

> **new UnsupportedFieldSelectionError**(): `UnsupportedFieldSelectionError`

Defined in: [src/lib/errors/unsupported-field-selection.error.ts:8](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-field-selection.error.ts#L8)

#### Returns

`UnsupportedFieldSelectionError`

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
