---
slug: 3.8/api/classes/drf-request-strategy
title: "DrfRequestStrategy"
---

Defined in: [src/lib/strategies/drf-request.strategy.ts:44](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/drf-request.strategy.ts#L44)

Request strategy for the Django REST Framework (DRF) driver

Generates URIs in DRF's flat query-parameter format, augmented by
django-filter's double-underscore lookup convention:

- Simple filters: `field=value` (multi-value collapses to `field__in=v1,v2`)
- Operator filters: `field__lookup=value` (translated from
  `FilterOperatorEnum` — `GTE`→`__gte`, `ILIKE`→`__icontains`,
  `BTW`→`__range`, `NULL`→`__isnull`, etc.)
- Ordering: `ordering=-field1,field2` (`-` prefix = DESC)
- Search: `search=term` (DRF's SearchFilter)
- Pagination: `page=N&page_size=M` (PageNumberPagination)

`ordering` and `page_size` are DRF-idiomatic param names and are
intentionally not configurable via `QueryBuilderOptions` — same
precedent as PostgREST's `order` and `offset`. PostgREST's full-text
search operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) and the generic
`NOT` have no django-filter equivalent and throw
`UnsupportedFilterOperatorError`.

## See

 - https://www.django-rest-framework.org/api-guide/filtering/
 - https://django-filter.readthedocs.io/

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new DrfRequestStrategy**(): `DrfRequestStrategy`

#### Returns

`DrfRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/drf-request.strategy.ts:51](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/drf-request.strategy.ts#L51)

Simple filters, operator filters (django-filter lookups), sorts, and
global search — no per-model fields, no relation includes, no flat
select (django-restql adds it but is not core DRF)

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

Defined in: [src/lib/strategies/drf-request.strategy.ts:82](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/drf-request.strategy.ts#L82)

Emit DRF-format query-string segments in canonical order:
filters → operator filters → ordering → search → pagination

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration

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
