---
slug: 3.8/api/classes/invalid-resource-name-error
title: "InvalidResourceNameError"
---

Defined in: [src/lib/errors/invalid-resource-name.error.ts:6](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/invalid-resource-name.error.ts#L6)

Error thrown when an invalid resource name is provided

Resource name must be a non-empty string.

## Extends

- `Error`

## Constructors

### Constructor

> **new InvalidResourceNameError**(`resource`): `InvalidResourceNameError`

Defined in: [src/lib/errors/invalid-resource-name.error.ts:7](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/invalid-resource-name.error.ts#L7)

#### Parameters

##### resource

`string` \| `null` \| `undefined`

#### Returns

`InvalidResourceNameError`

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
