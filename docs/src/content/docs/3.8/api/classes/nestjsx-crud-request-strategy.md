---
slug: 3.8/api/classes/nestjsx-crud-request-strategy
title: "NestjsxCrudRequestStrategy"
---

Defined in: [src/lib/strategies/nestjsx-crud-request.strategy.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/nestjsx-crud-request.strategy.ts#L34)

Request strategy for the @nestjsx/crud driver

Generates URIs in [@nestjsx/crud's pipe-delimited query format](https://github.com/nestjsx/crud/wiki/Requests):
- Filters: `filter=field||$eq||value` (repeatable; multi-value
  collapses to `filter=field||$in||v1,v2`)
- Operator filters: `filter=field||$op||value` (translated from
  `FilterOperatorEnum` — `CONTAINS`→`$cont`, `ILIKE`→`$contL`,
  `SW`→`$starts`, `BTW`→`$between`, `NOT`→`$ne`/`$notin`,
  `NULL`→`$isnull`/`$notnull` with no value segment)
- Joins: `join=relation` (repeatable, from `addIncludes`)
- Field selection (flat): `fields=col1,col2` (from `addSelect`)
- Sorts: `sort=field,ASC` (repeatable, uppercase direction)
- Pagination (page-based): `page=N&limit=N`

The JSON-shaped `s={...}` search parameter is intentionally out of
scope: it is not a plain search term, so `setSearch` throws
`UnsupportedSearchError` on this driver. PostgREST-native full-text
search operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
`UnsupportedFilterOperatorError`.

## See

https://github.com/nestjsx/crud/wiki/Requests

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new NestjsxCrudRequestStrategy**(): `NestjsxCrudRequestStrategy`

#### Returns

`NestjsxCrudRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/nestjsx-crud-request.strategy.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/nestjsx-crud-request.strategy.ts#L41)

Filters, operator filters, joins (`includes`), flat field selection
(`select`), sorts — no per-model fields, no global search (the `s`
parameter is JSON-shaped, not a plain term)

#### Overrides

`AbstractRequestStrategy.capabilities`

## Methods

### assertResource()

> `protected` **assertResource**(`state`): `void`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:89](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L89)

Throw if the resource is not set on the state

Centralises the message that was previously copy-pasted across four
of the five concrete strategies.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

#### Returns

`void`

#### Throws

Error if `state.resource` is empty

#### Inherited from

`AbstractRequestStrategy.assertResource`

***

### baseUri()

> `protected` **baseUri**(`state`): `string`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:101](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L101)

Compute the base path (no query string)

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

#### Returns

`string`

The base URI without the query separator (e.g. `/users` or `https://api.example.com/users`)

#### Inherited from

`AbstractRequestStrategy.baseUri`

***

### buildUri()

> **buildUri**(`state`, `options`): `string`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:42](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L42)

Compose the full request URI from the given state

Template method: validates the resource, computes the base path,
delegates the per-driver query-string segments to `parts(...)`, and
joins them with the conventional `?`/`&` separators.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration

#### Returns

`string`

The composed URI string

#### Throws

Error if the resource is not set

#### Inherited from

`AbstractRequestStrategy.buildUri`

***

### join()

> `protected` **join**(`base`, `segments`): `string`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:115](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L115)

Glue the base URI and the per-driver query-string segments

Returns the bare base when no segments were emitted (e.g. PostgREST
in RANGE mode with no filters), otherwise joins with `?` + `&`.

#### Parameters

##### base

`string`

The base URI from `_baseUri`

##### segments

`string`[]

The query-string fragments from `parts(...)`

#### Returns

`string`

The full URI

#### Inherited from

`AbstractRequestStrategy.join`

***

### parts()

> `protected` **parts**(`state`, `options`): `string`[]

Defined in: [src/lib/strategies/nestjsx-crud-request.strategy.ts:80](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/nestjsx-crud-request.strategy.ts#L80)

Emit @nestjsx/crud-format query-string segments in canonical order:
fields → filters → operator filters → join → sort → limit → page

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration (used
for `page` / `limit`, whose defaults match the wire format; the
`fields` / `filter` / `join` / `sort` keys are fixed by the server)

#### Returns

`string`[]

Ordered query-string fragments

#### Overrides

`AbstractRequestStrategy.parts`

***

### validateLimit()

> **validateLimit**(`limit`): `void`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:59](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L59)

Validate that a limit value is acceptable for this driver

Default policy: positive integer. Drivers that recognise a sentinel
(NestJS treats `-1` as "fetch all") override this method.

#### Parameters

##### limit

`number`

The limit value to validate

#### Returns

`void`

#### Throws

If the value is not a positive integer

#### Inherited from

`AbstractRequestStrategy.validateLimit`
