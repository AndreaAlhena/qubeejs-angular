---
slug: 3.8/guide/per-component-instances
title: "Per-component instances"
---

By default, `provideNgQubee()` registers `NgQubeeService` at the **environment injector**, so every component that injects it shares the same query-builder state. That's the right default for an app with one query view at a time.

When you need an isolated instance — e.g. a feature component whose filters and pagination must not bleed into the app-wide one — spread `provideNgQubeeInstance()` into the component's `providers`:

```typescript
import { Component } from '@angular/core';
import { NgQubeeService, provideNgQubeeInstance } from 'ng-qubee';

@Component({
  selector: 'app-product-list',
  standalone: true,
  providers: [...provideNgQubeeInstance()],
  template: '...'
})
export class ProductListComponent {
  constructor(private _qb: NgQubeeService) {}
}
```

The component gets its own `NgQubeeService`, `NestService`, and `PaginationService`. Driver, strategies, and options are inherited from the environment injector configured by `provideNgQubee()` — you still configure the library once at bootstrap.

## When to reach for it

- Two routes that show different paginated views simultaneously (e.g. master/detail with a list on each side)
- Reusable list components that should each track their own page / filters
- Tabs or panels where state must persist independently per tab
- Tests that need a clean state per spec

## When the default is enough

- Single-list-per-page apps
- Apps where users navigate between routes (state can reset on route change via `reset()` in `OnInit`)

## Public injection tokens

If you need finer-grained control, the DI tokens are exported:

```typescript
import {
  NG_QUBEE_DRIVER,
  NG_QUBEE_REQUEST_STRATEGY,
  NG_QUBEE_REQUEST_OPTIONS,
  NG_QUBEE_RESPONSE_STRATEGY,
  NG_QUBEE_RESPONSE_OPTIONS
} from 'ng-qubee';
```

These are what `provideNgQubee()` registers under the hood. You can override any of them at any injector level — though the high-level helpers cover ~99% of use cases.
