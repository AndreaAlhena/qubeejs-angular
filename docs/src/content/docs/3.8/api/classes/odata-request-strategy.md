---
slug: 3.8/api/classes/odata-request-strategy
title: "OdataRequestStrategy"
---

Defined in: [src/lib/strategies/odata-request.strategy.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/odata-request.strategy.ts#L41)

Request strategy for the OData v4 driver

Generates URIs using [OData's system query options](https://www.odata.org/getting-started/basic-tutorial/#queryData):
- Filters: a single `$filter=` parameter holding ` and `-joined terms in
  OData's expression language (`Price gt 20 and Category eq 'Electronics'`)
- Operator filters: translated from `FilterOperatorEnum` — see the
  mapping on `_formatOperatorTerms`
- Sorts: `$orderby=field asc,other desc` (CSV with explicit direction)
- Select: `$select=col1,col2`
- Expand: `$expand=rel,other($select=col1,col2)` — plain relations come
  from `addIncludes`, column-projected ones from `addEmbedded`
- Search: `$search=term` (OData v4 free-text search)
- Pagination: `$top=N&$skip=M` (skip derived from state.page) plus a
  constant `$count=true` so responses carry the `@odata.count` total
  the response strategy needs

The `$`-prefixed parameter names are fixed by the OData specification
and intentionally not configurable through `QueryBuilderOptions`; they
live as private statics so they are visible in one place. String
literals are single-quoted with embedded quotes doubled (`'O''Brien'`)
per the OData ABNF; numbers and booleans are emitted bare.

PostgREST-native full-text search operators (`FTS`, `PHFTS`, `PLFTS`,
`WFTS`) throw `UnsupportedFilterOperatorError` — use `$search` or the
`CONTAINS` / `ILIKE` operator filters instead.

## See

 - https://www.odata.org/
 - https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new OdataRequestStrategy**(): `OdataRequestStrategy`

#### Returns

`OdataRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/odata-request.strategy.ts:48](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/odata-request.strategy.ts#L48)

Filters, operator filters, sorts, flat select, includes and embedded
(both folding into `$expand`), global search — no per-model fields
(OData has no JSON:API-style `fields[type]` projection)

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

> `protected` **parts**(`state`, `_options`): `string`[]

Defined in: [src/lib/strategies/odata-request.strategy.ts:84](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/odata-request.strategy.ts#L84)

Emit OData-format query-string segments in canonical order:
$filter → $orderby → $select → $expand → $search → $count → $top → $skip

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### \_options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration (unused —
every OData system query option name is fixed by the specification)

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
