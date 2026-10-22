---
slug: 3.8/api/classes/nestjsx-crud-response-options
title: "NestjsxCrudResponseOptions"
---

Defined in: [src/lib/models/response-options.ts:260](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L260)

Pre-configured ResponseOptions for the @nestjsx/crud driver

The `getMany` envelope is flat: `{ data, count, total, page,
pageCount }`. `perPage` defaults to the `count` field — the number of
entities on the **current** page, which equals the requested limit on
every page except a partial last one. The envelope carries no
`from`/`to` indices and no navigation links, so those paths default to
empty strings (the strategy derives `from`/`to` and leaves the URLs
`undefined`); consumers can override any path via `IPaginationConfig`.

## Extends

- [`ResponseOptions`](/3.8/api/classes/response-options/)

## Constructors

### Constructor

> **new NestjsxCrudResponseOptions**(`options`): `NestjsxCrudResponseOptions`

Defined in: [src/lib/models/response-options.ts:261](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L261)

#### Parameters

##### options

[`IPaginationConfig`](/3.8/api/interfaces/ipagination-config/)

#### Returns

`NestjsxCrudResponseOptions`

#### Overrides

[`ResponseOptions`](/3.8/api/classes/response-options/).[`constructor`](/3.8/api/classes/response-options/#constructor)

## Properties

### currentPage

> `readonly` **currentPage**: `string`

Defined in: [src/lib/models/response-options.ts:18](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L18)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`currentPage`](/3.8/api/classes/response-options/#currentpage)

***

### data

> `readonly` **data**: `string`

Defined in: [src/lib/models/response-options.ts:19](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L19)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`data`](/3.8/api/classes/response-options/#data)

***

### firstPageUrl

> `readonly` **firstPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:20](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L20)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`firstPageUrl`](/3.8/api/classes/response-options/#firstpageurl)

***

### from

> `readonly` **from**: `string`

Defined in: [src/lib/models/response-options.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L21)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`from`](/3.8/api/classes/response-options/#from)

***

### lastPage

> `readonly` **lastPage**: `string`

Defined in: [src/lib/models/response-options.ts:22](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L22)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`lastPage`](/3.8/api/classes/response-options/#lastpage)

***

### lastPageUrl

> `readonly` **lastPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L23)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`lastPageUrl`](/3.8/api/classes/response-options/#lastpageurl)

***

### nextPageUrl

> `readonly` **nextPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L24)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`nextPageUrl`](/3.8/api/classes/response-options/#nextpageurl)

***

### path

> `readonly` **path**: `string`

Defined in: [src/lib/models/response-options.ts:25](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L25)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`path`](/3.8/api/classes/response-options/#path)

***

### perPage

> `readonly` **perPage**: `string`

Defined in: [src/lib/models/response-options.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L26)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`perPage`](/3.8/api/classes/response-options/#perpage)

***

### prevPageUrl

> `readonly` **prevPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:27](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L27)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`prevPageUrl`](/3.8/api/classes/response-options/#prevpageurl)

***

### to

> `readonly` **to**: `string`

Defined in: [src/lib/models/response-options.ts:28](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L28)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`to`](/3.8/api/classes/response-options/#to)

***

### total

> `readonly` **total**: `string`

Defined in: [src/lib/models/response-options.ts:29](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L29)

#### Inherited from

[`ResponseOptions`](/3.8/api/classes/response-options/).[`total`](/3.8/api/classes/response-options/#total)
