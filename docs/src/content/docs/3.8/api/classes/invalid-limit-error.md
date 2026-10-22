---
slug: 3.8/api/classes/invalid-limit-error
title: "InvalidLimitError"
---

Defined in: [src/lib/errors/invalid-limit.error.ts:9](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/invalid-limit.error.ts#L9)

Thrown when a limit value does not satisfy the active driver's constraints

Validation is driver-scoped: most drivers require an integer `>= 1`, while
the NestJS driver additionally accepts `-1` as a "fetch all items" sentinel
(as documented by nestjs-paginate). The message is tailored accordingly so
the caller understands which values are permitted.

## Extends

- `Error`

## Constructors

### Constructor

> **new InvalidLimitError**(`limit`, `allowFetchAll?`): `InvalidLimitError`

Defined in: [src/lib/errors/invalid-limit.error.ts:15](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/errors/invalid-limit.error.ts#L15)

#### Parameters

##### limit

`number`

The rejected limit value

##### allowFetchAll?

`boolean` = `false`

Whether the active driver accepts `-1` (fetch all)

#### Returns

`InvalidLimitError`

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
