---
slug: 3.8/api/classes/response-options
title: "ResponseOptions"
---

Defined in: [src/lib/models/response-options.ts:17](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L17)

Resolved response field key names with defaults applied

Maps logical pagination concepts to the actual key names
used in the API response. Unset values fall back to Laravel defaults.

For NestJS responses, use dot-notation paths:
```typescript
new ResponseOptions({
  currentPage: 'meta.currentPage',
  total: 'meta.totalItems'
});
```

## Extended by

- [`ApiPlatformResponseOptions`](/3.8/api/classes/api-platform-response-options/)
- [`DirectusResponseOptions`](/3.8/api/classes/directus-response-options/)
- [`DrfResponseOptions`](/3.8/api/classes/drf-response-options/)
- [`FeathersResponseOptions`](/3.8/api/classes/feathers-response-options/)
- [`JsonApiResponseOptions`](/3.8/api/classes/json-api-response-options/)
- [`JsonServerResponseOptions`](/3.8/api/classes/json-server-response-options/)
- [`NestjsResponseOptions`](/3.8/api/classes/nestjs-response-options/)
- [`NestjsxCrudResponseOptions`](/3.8/api/classes/nestjsx-crud-response-options/)
- [`OdataResponseOptions`](/3.8/api/classes/odata-response-options/)
- [`PayloadResponseOptions`](/3.8/api/classes/payload-response-options/)
- [`PocketbaseResponseOptions`](/3.8/api/classes/pocketbase-response-options/)
- [`SieveResponseOptions`](/3.8/api/classes/sieve-response-options/)
- [`SpringResponseOptions`](/3.8/api/classes/spring-response-options/)
- [`StrapiResponseOptions`](/3.8/api/classes/strapi-response-options/)

## Constructors

### Constructor

> **new ResponseOptions**(`options`): `ResponseOptions`

Defined in: [src/lib/models/response-options.ts:31](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L31)

#### Parameters

##### options

[`IPaginationConfig`](/3.8/api/interfaces/ipagination-config/)

#### Returns

`ResponseOptions`

## Properties

### currentPage

> `readonly` **currentPage**: `string`

Defined in: [src/lib/models/response-options.ts:18](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L18)

***

### data

> `readonly` **data**: `string`

Defined in: [src/lib/models/response-options.ts:19](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L19)

***

### firstPageUrl

> `readonly` **firstPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:20](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L20)

***

### from

> `readonly` **from**: `string`

Defined in: [src/lib/models/response-options.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L21)

***

### lastPage

> `readonly` **lastPage**: `string`

Defined in: [src/lib/models/response-options.ts:22](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L22)

***

### lastPageUrl

> `readonly` **lastPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L23)

***

### nextPageUrl

> `readonly` **nextPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L24)

***

### path

> `readonly` **path**: `string`

Defined in: [src/lib/models/response-options.ts:25](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L25)

***

### perPage

> `readonly` **perPage**: `string`

Defined in: [src/lib/models/response-options.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L26)

***

### prevPageUrl

> `readonly` **prevPageUrl**: `string`

Defined in: [src/lib/models/response-options.ts:27](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L27)

***

### to

> `readonly` **to**: `string`

Defined in: [src/lib/models/response-options.ts:28](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L28)

***

### total

> `readonly` **total**: `string`

Defined in: [src/lib/models/response-options.ts:29](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/models/response-options.ts#L29)
