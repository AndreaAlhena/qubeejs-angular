---
slug: 3.8/api/classes/paginated-collection
title: "PaginatedCollection"
---

Defined in: [src/lib/models/paginated-collection.ts:5](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L5)

## Type Parameters

### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

## Constructors

### Constructor

> **new PaginatedCollection**\<`T`\>(`data`, `page`, `from?`, `to?`, `total?`, `perPage?`, `prevPageUrl?`, `nextPageUrl?`, `lastPage?`, `firstPageUrl?`, `lastPageUrl?`): `PaginatedCollection`\<`T`\>

Defined in: [src/lib/models/paginated-collection.ts:6](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L6)

#### Parameters

##### data

`T`[]

##### page

`number`

##### from?

`number`

##### to?

`number`

##### total?

`number`

##### perPage?

`number`

##### prevPageUrl?

`string`

##### nextPageUrl?

`string`

##### lastPage?

`number`

##### firstPageUrl?

`string`

##### lastPageUrl?

`string`

#### Returns

`PaginatedCollection`\<`T`\>

## Properties

### data

> **data**: `T`[]

Defined in: [src/lib/models/paginated-collection.ts:7](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L7)

***

### firstPageUrl?

> `readonly` `optional` **firstPageUrl?**: `string`

Defined in: [src/lib/models/paginated-collection.ts:16](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L16)

***

### from?

> `readonly` `optional` **from?**: `number`

Defined in: [src/lib/models/paginated-collection.ts:9](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L9)

***

### lastPage?

> `readonly` `optional` **lastPage?**: `number`

Defined in: [src/lib/models/paginated-collection.ts:15](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L15)

***

### lastPageUrl?

> `readonly` `optional` **lastPageUrl?**: `string`

Defined in: [src/lib/models/paginated-collection.ts:17](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L17)

***

### nextPageUrl?

> `readonly` `optional` **nextPageUrl?**: `string`

Defined in: [src/lib/models/paginated-collection.ts:14](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L14)

***

### page

> `readonly` **page**: `number`

Defined in: [src/lib/models/paginated-collection.ts:8](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L8)

***

### perPage?

> `readonly` `optional` **perPage?**: `number`

Defined in: [src/lib/models/paginated-collection.ts:12](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L12)

***

### prevPageUrl?

> `readonly` `optional` **prevPageUrl?**: `string`

Defined in: [src/lib/models/paginated-collection.ts:13](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L13)

***

### to?

> `readonly` `optional` **to?**: `number`

Defined in: [src/lib/models/paginated-collection.ts:10](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L10)

***

### total?

> `readonly` `optional` **total?**: `number`

Defined in: [src/lib/models/paginated-collection.ts:11](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L11)

## Methods

### normalize()

> **normalize**(`id?`): `INormalized`

Defined in: [src/lib/models/paginated-collection.ts:35](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/paginated-collection.ts#L35)

Normalize the collection to a paginated list of ids for state-managed applications.

This method returns a single key object, where the key is the page number and the associated value is
an array of ids. Each id is fetched by the collection items, looking up for the "id" key. If an id is supplied
to this method, it will be used instead of the default "id" key.

Please note that in case the key doesn't exist in the collection's item, a KeyNotFoundError is thrown

#### Parameters

##### id?

`string`

#### Returns

`INormalized`

[]

#### Throws

KeyNotFoundItem
