---
slug: 3.8/api/interfaces/irequest-strategy
title: "IRequestStrategy"
---

Defined in: [src/lib/interfaces/request-strategy.interface.ts:11](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/request-strategy.interface.ts#L11)

Strategy interface for building request URIs

Each driver implements this interface to produce URIs
in the format expected by the corresponding backend.

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/interfaces/request-strategy.interface.ts:20](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/request-strategy.interface.ts#L20)

Capability flags declared by this driver

Read by `NgQubeeService` to gate feature methods (e.g. `addFilter`)
without hardcoding `DriverEnum` checks. Each strategy returns a
static, immutable capability map.

## Methods

### buildPaginationHeaders()?

> `optional` **buildPaginationHeaders**(`state`): `Record`\<`string`, `string`\> \| `null`

Defined in: [src/lib/interfaces/request-strategy.interface.ts:47](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/request-strategy.interface.ts#L47)

Compute HTTP request headers carrying pagination metadata

Honoured only by drivers that support header-based pagination (the
PostgREST driver configured with `PaginationModeEnum.RANGE`). All
other drivers should return `null` — which is also the default when
a driver does not override this method.

When the method returns a non-null object, `NgQubeeService.buildUri`
is expected to have already omitted URL-level pagination params for
that request; the consumer then merges these headers into the HTTP
call so the server knows the requested range.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

#### Returns

`Record`\<`string`, `string`\> \| `null`

A map of header name → value, or `null` when not applicable

***

### buildUri()

> **buildUri**(`state`, `options`): `string`

Defined in: [src/lib/interfaces/request-strategy.interface.ts:29](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/request-strategy.interface.ts#L29)

Build a URI string from the given query builder state

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

***

### validateLimit()

> **validateLimit**(`limit`): `void`

Defined in: [src/lib/interfaces/request-strategy.interface.ts:59](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/request-strategy.interface.ts#L59)

Assert that the given limit value is valid for this driver

Validation is driver-scoped because the accepted range differs by
backend: nestjs-paginate treats `-1` as a "fetch all" sentinel, while
other backends (Laravel, Spatie, JSON:API) require a positive integer.

#### Parameters

##### limit

`number`

The limit value to validate

#### Returns

`void`

#### Throws

If the value is not accepted by the driver
