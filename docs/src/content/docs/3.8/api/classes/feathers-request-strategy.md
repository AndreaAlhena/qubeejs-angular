---
slug: 3.8/api/classes/feathers-request-strategy
title: "FeathersRequestStrategy"
---

Defined in: [src/lib/strategies/feathers-request.strategy.ts:51](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/feathers-request.strategy.ts#L51)

Request strategy for the FeathersJS driver

Generates URIs in [Feathers' common database adapter query syntax](https://feathersjs.com/api/databases/querying):
- Filters: `field=value` (exact match); multi-value folds to `$in`
  (`field[$in][0]=v1&field[$in][1]=v2`)
- Operator filters: `field[$op]=value` (translated from
  `FilterOperatorEnum` — `BTW`→`$gte`+`$lte` pair, `NOT`→`$ne`/`$nin`)
- Sorts: `$sort[field]=1` (ASC) / `$sort[field]=-1` (DESC)
- Flat field selection: `$select[0]=col1&$select[1]=col2`
- Pagination (offset-based): `$limit=N&$skip=M` with
  `skip = (page - 1) × limit`

The dollar-prefixed query keys (`$limit`, `$skip`, `$sort`, `$select`)
are fixed by the Feathers adapter-commons parser and intentionally not
configurable through `QueryBuilderOptions`; they live as private
statics so they are visible in one place.

Feathers' core adapter syntax has no relation includes, no per-model
field selection, and no global search — the corresponding fluent
methods throw the matching `Unsupported*Error`. `CONTAINS` / `ILIKE` /
`SW` (LIKE-style matching is adapter-specific, not core), `NULL` (no
null-check operator on the wire), and the PostgREST-native full-text
operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
`UnsupportedFilterOperatorError`.

## See

https://feathersjs.com/api/databases/querying

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new FeathersRequestStrategy**(): `FeathersRequestStrategy`

#### Returns

`FeathersRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/feathers-request.strategy.ts:58](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/feathers-request.strategy.ts#L58)

Filters, operator filters, sorts, flat field selection (`select`) —
no per-model fields, no includes, no global search, no embedded
resources

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

Defined in: [src/lib/strategies/feathers-request.strategy.ts:90](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/feathers-request.strategy.ts#L90)

Emit Feathers-format query-string segments in canonical order:
filters → operator filters → $sort → $select → $limit → $skip

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### \_options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration (unused;
Feathers' system keys are fixed by the server)

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
