---
sidebar_position: 2
title: Laravel
---

# Laravel Driver

Targets vanilla Laravel pagination — **limit + page only**, no filters, no sorts, no fields, no includes. If you need more, use the [Spatie driver](./spatie.md), which is also Laravel-native.

## Configure

```typescript
import { LARAVEL_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: LARAVEL_DRIVER })]
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
