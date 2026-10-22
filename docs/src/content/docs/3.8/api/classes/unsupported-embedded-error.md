---
slug: 3.8/api/classes/unsupported-embedded-error
title: "UnsupportedEmbeddedError"
---

Defined in: [src/lib/errors/unsupported-embedded.error.ts:10](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-embedded.error.ts#L10)

Error thrown when embedded resources are attempted with a driver that
does not support them

Embedded-resource fetching (`select=col,relation(col1,col2)`) is a
PostgREST-native join mechanism and is only supported by the PostgREST
driver. Drivers with a standalone relation parameter expose it through
`addIncludes()` instead (JSON:API, Spatie, Strapi, @nestjsx/crud).

## Extends

- `Error`

## Constructors

### Constructor

> **new UnsupportedEmbeddedError**(): `UnsupportedEmbeddedError`

Defined in: [src/lib/errors/unsupported-embedded.error.ts:11](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/unsupported-embedded.error.ts#L11)

#### Returns

`UnsupportedEmbeddedError`

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
