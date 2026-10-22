---
slug: 3.8/api/interfaces/ioperator-filter
title: "IOperatorFilter"
---

Defined in: [src/lib/interfaces/operator-filter.interface.ts:19](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/operator-filter.interface.ts#L19)

Represents a filter with an explicit operator for the NestJS driver

Operator filters produce query parameters in the format:
`filter.field=$operator:value`

## Example

```typescript
const filter: IOperatorFilter = {
  field: 'age',
  operator: FilterOperatorEnum.GTE,
  values: [18]
};
// Produces: filter.age=$gte:18
```

## Properties

### field

> **field**: `string`

Defined in: [src/lib/interfaces/operator-filter.interface.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/operator-filter.interface.ts#L21)

The field name to filter on

***

### operator

> **operator**: [`FilterOperatorEnum`](/3.8/api/enumerations/filter-operator-enum/)

Defined in: [src/lib/interfaces/operator-filter.interface.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/operator-filter.interface.ts#L23)

The filter operator to apply

***

### values

> **values**: (`string` \| `number` \| `boolean`)[]

Defined in: [src/lib/interfaces/operator-filter.interface.ts:25](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/operator-filter.interface.ts#L25)

The value(s) for the filter
