---
slug: 3.8/api/interfaces/iquery-builder-config
title: "IQueryBuilderConfig"
---

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:7](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L7)

Configuration interface for customizing request query parameter key names

Each property maps a logical query concept to the actual query parameter name
used in the generated URI. The defaults depend on the selected driver.

## Properties

### appends?

> `optional` **appends?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:9](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L9)

Key for the appends parameter (Laravel only, default: 'append')

***

### fields?

> `optional` **fields?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:11](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L11)

Key for the fields parameter (Laravel: 'fields', NestJS: 'select')

***

### filters?

> `optional` **filters?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:13](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L13)

Key for the filters parameter (default: 'filter')

***

### includes?

> `optional` **includes?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:15](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L15)

Key for the includes parameter (Laravel only, default: 'include')

***

### limit?

> `optional` **limit?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:17](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L17)

Key for the limit parameter (default: 'limit')

***

### page?

> `optional` **page?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:19](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L19)

Key for the page parameter (default: 'page')

***

### search?

> `optional` **search?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L21)

Key for the search parameter (NestJS only, default: 'search')

***

### select?

> `optional` **select?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L23)

Key for the select parameter (NestJS only, default: 'select')

***

### sort?

> `optional` **sort?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:25](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L25)

Key for the sort parameter (Laravel: 'sort', NestJS: 'sortBy')

***

### sortBy?

> `optional` **sortBy?**: `string`

Defined in: [src/lib/interfaces/query-builder-config.interface.ts:27](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-config.interface.ts#L27)

Key for the sortBy parameter (NestJS only, default: 'sortBy')
