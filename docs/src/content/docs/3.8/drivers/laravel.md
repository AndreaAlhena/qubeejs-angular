---
slug: 3.8/drivers/laravel
title: "Laravel Driver"
sidebar:
  label: "Laravel"
---

Targets vanilla Laravel pagination — **limit + page only**, no filters, no sorts, no fields, no includes. If you need more, use the [Spatie driver](/3.8/drivers/spatie/), which is also Laravel-native.

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.LARAVEL })]
});
```

## Wire format

```
/users?limit=15&page=1
```

## Supported features

`setLimit`, `setPage`. Everything else throws an `Unsupported*Error`.

## Response shape

```json
{
  "data": [...],
  "current_page": 1,
  "per_page": 15,
  "total": 100,
  "from": 1,
  "to": 15,
  "first_page_url": "...",
  "last_page": 7,
  "last_page_url": "...",
  "next_page_url": "...",
  "prev_page_url": null
}
```

Standard Laravel paginator. The library reads each key directly off the response body — no nested `meta` envelope.
