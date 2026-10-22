---
slug: 3.8/api/classes/api-platform-request-strategy
title: "ApiPlatformRequestStrategy"
---

Defined in: [src/lib/strategies/api-platform-request.strategy.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/api-platform-request.strategy.ts#L41)

Request strategy for the API Platform (Symfony) driver

Generates URIs in [API Platform's filter format](https://api-platform.com/docs/core/filters/):
- Filters: `field=value` (exact); multi-value uses the array syntax
  (`field[]=v1&field[]=v2`, OR semantics)
- Operator filters: bracket syntax `field[op]=value` — RangeFilter
  (`gt`/`gte`/`lt`/`lte`/`between`), SearchFilter strategies
  (`partial`/`ipartial`/`start`), ExistsFilter (`exists`) — see the
  mapping on `_formatOperatorSegments`
- Relation filtering: dot paths pass through (`author.name=John` via
  `addFilter('author.name', 'John')`)
- Sorts: `order[field]=asc` / `order[field]=desc` (one param per rule)
- Pagination: `page=N&itemsPerPage=M`

The `order` and `itemsPerPage` keys are API Platform conventions and
intentionally not configurable through `QueryBuilderOptions`; `page`
honours the existing option key (its default matches the wire format).

Date fields use API Platform's DateFilter (`field[after]=…`,
`field[before]=…`) — there is no `FilterOperatorEnum` counterpart, but
the bracket key passes through `addFilter` directly:
`addFilter('createdAt[after]', '2023-01-01')`.

`NOT` (no negation filter in API Platform core) and the
PostgREST-native full-text operators (`FTS`, `PHFTS`, `PLFTS`,
`WFTS`) throw `UnsupportedFilterOperatorError`.

## See

https://api-platform.com/docs/core/filters/

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new ApiPlatformRequestStrategy**(): `ApiPlatformRequestStrategy`

#### Returns

`ApiPlatformRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/api-platform-request.strategy.ts:48](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/api-platform-request.strategy.ts#L48)

Filters, operator filters, sorts — no per-model fields, no
includes (relations embed via serialization groups server-side),
no flat select, no global search parameter

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

Defined in: [src/lib/strategies/api-platform-request.strategy.ts:79](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/api-platform-request.strategy.ts#L79)

Emit API Platform-format query-string segments in canonical order:
filters → operator filters → order → page → itemsPerPage

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration (used
for `page`, whose default matches the wire format)

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
