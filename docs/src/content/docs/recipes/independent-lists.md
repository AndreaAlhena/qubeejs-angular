---
title: Two independent lists on one page
description: Give each list component its own query builder with provideQubeeInstance(), so a filter or a page change in one never leaks into the other or re-fetches it.
---

A dashboard shows customers on the left and orders on the right. Each list is its own component with its own search box and pager, and each works fine when it is the only one on the screen. Put both on one page and they start to interfere: a search in one filters the other, and a click on one list's "Next" turns the page of both. Both components inject the same `QubeeQueryBuilder`. The fix is one line per component.

## The problem

`provideQubee()` registers `QubeeQueryBuilder` at the **environment injector**, so every component that injects it gets the same instance, which means one resource, one set of filters and one page for the whole application:

```typescript title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { STRAPI_DRIVER, provideQubee } from '@qubeejs/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideQubee({ baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER })
  ]
};
```

Two components, each written as if it were alone:

```typescript title="customer-list.component.ts"
import { Component, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { QubeeQueryBuilder, RawResponse } from '@qubeejs/angular';

@Component({
  selector: 'app-customer-list',
  template: `<input placeholder="Search customers" (input)="search($event)" />`
})
export class CustomerListComponent {
  private readonly _qb = inject(QubeeQueryBuilder); // the app-wide instance
  protected readonly customers = httpResource<RawResponse>(() => this._qb.uri());

  constructor() {
    this._qb.setResource('customers').setLimit(10);
  }

  protected search(event: Event): void {
    this._qb.addFilter('name', (event.target as HTMLInputElement).value);
  }
}
```

```typescript title="order-list.component.ts"
import { Component, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { QubeeQueryBuilder, RawResponse } from '@qubeejs/angular';

@Component({
  selector: 'app-order-list',
  template: `<button type="button" (click)="qb.nextPage()">Next</button>`
})
export class OrderListComponent {
  protected readonly qb = inject(QubeeQueryBuilder); // the same instance
  protected readonly orders = httpResource<RawResponse>(() => this.qb.uri());

  constructor() {
    this.qb.setResource('orders').setLimit(10);
  }
}
```

```typescript title="dashboard.component.ts"
import { Component } from '@angular/core';

import { CustomerListComponent } from './customer-list.component';
import { OrderListComponent } from './order-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [CustomerListComponent, OrderListComponent],
  template: `
    <app-customer-list />
    <app-order-list />
  `
})
export class DashboardComponent {}
```

Here is what happens on screen:

1. Both constructors write to one store, and the last write wins. `setResource('orders')` replaces `'customers'`, so **both** resources fetch `https://api.example.com/orders?pagination[page]=1&pagination[pageSize]=10`: the customer list gets orders.
2. Typing `ada` in the customer search adds `filters[name][$eq]=ada` to the shared state. Both `uri()` signals change, so **both** resources fetch again, and the order list is now filtered by a customer name.
3. "Next" in the order list moves the shared page to 2, and both lists fetch page 2.

Neither component has a bug of its own. They break because they share one instance.

## The solution

Spread `provideQubeeInstance()` into each list component's `providers`. Each component then gets its own builder, store and paginator, which is where the query state lives, while the driver configured by `provideQubee()` is shared.

A pager that works for whichever list it sits in:

```typescript title="pager.component.ts"
import { Component, inject } from '@angular/core';
import { QubeeQueryBuilder } from '@qubeejs/angular';

@Component({
  selector: 'app-pager',
  template: `
    <button type="button" [disabled]="qb.isFirstPage()" (click)="qb.previousPage()">Prev</button>
    <span>Page {{ qb.currentPage() }} of {{ qb.totalPages() ?? '…' }}</span>
    <button type="button" [disabled]="qb.isLastPage()" (click)="qb.nextPage()">Next</button>
  `
})
export class PagerComponent {
  // No providers here: this resolves to the nearest ancestor's instance.
  protected readonly qb = inject(QubeeQueryBuilder);
}
```

The customer list, with its own instance:

```typescript title="customer-list.component.ts" ins="providers: [...provideQubeeInstance()],"
import { Component, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import {
  PaginatedCollection,
  QubeePaginator,
  QubeeQueryBuilder,
  RawResponse,
  provideQubeeInstance
} from '@qubeejs/angular';

import { PagerComponent } from './pager.component';

type Customer = { id: number; name: string };

@Component({
  selector: 'app-customer-list',
  imports: [PagerComponent],
  providers: [...provideQubeeInstance()],
  template: `
    <input placeholder="Search customers" (input)="search($event)" />

    <ul>
      @for (customer of page()?.data; track customer.id) {
        <li>{{ customer.name }}</li>
      }
    </ul>

    <app-pager />
  `
})
export class CustomerListComponent {
  private readonly _paginator = inject(QubeePaginator);
  private readonly _qb = inject(QubeeQueryBuilder);
  private readonly _response = httpResource<RawResponse>(() => this._qb.uri());

  protected readonly page = signal<PaginatedCollection<Customer> | undefined>(undefined);

  constructor() {
    this._qb.setResource('customers').setLimit(10);

    // paginate() syncs the page bounds into this component's store,
    // so <app-pager /> learns the last page. It writes, so it runs in an effect.
    effect(() => {
      if (this._response.hasValue()) {
        this.page.set(this._paginator.paginate<Customer>(this._response.value()));
      }
    });
  }

  protected search(event: Event): void {
    const term = (event.target as HTMLInputElement).value;

    if (term) {
      this._qb.addFilter('name', term);
    } else {
      this._qb.deleteFilters('name');
    }
  }
}
```

The order list, the same way:

```typescript title="order-list.component.ts" ins="providers: [...provideQubeeInstance()],"
import { Component, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import {
  PaginatedCollection,
  QubeePaginator,
  QubeeQueryBuilder,
  RawResponse,
  SortEnum,
  provideQubeeInstance
} from '@qubeejs/angular';

import { PagerComponent } from './pager.component';

type Order = { id: number; reference: string };

@Component({
  selector: 'app-order-list',
  imports: [PagerComponent],
  providers: [...provideQubeeInstance()],
  template: `
    <ul>
      @for (order of page()?.data; track order.id) {
        <li>{{ order.reference }}</li>
      }
    </ul>

    <app-pager />
  `
})
export class OrderListComponent {
  private readonly _paginator = inject(QubeePaginator);
  private readonly _qb = inject(QubeeQueryBuilder);
  private readonly _response = httpResource<RawResponse>(() => this._qb.uri());

  protected readonly page = signal<PaginatedCollection<Order> | undefined>(undefined);

  constructor() {
    this._qb.setResource('orders').addSort('createdAt', SortEnum.DESC).setLimit(10);

    effect(() => {
      if (this._response.hasValue()) {
        this.page.set(this._paginator.paginate<Order>(this._response.value()));
      }
    });
  }
}
```

The page stays as it was:

```typescript title="dashboard.component.ts"
import { Component } from '@angular/core';

import { CustomerListComponent } from './customer-list.component';
import { OrderListComponent } from './order-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [CustomerListComponent, OrderListComponent],
  template: `
    <app-customer-list />
    <app-order-list />
  `
})
export class DashboardComponent {}
```

Now the customer list fetches `/customers?pagination[page]=1&pagination[pageSize]=10` and the order list fetches `/orders?sort[0]=createdAt:desc&pagination[page]=1&pagination[pageSize]=10`. A search fetches customers again and nothing else, and each pager shows the page count of its own list.

## Why it works

`inject(QubeeQueryBuilder)` resolves from the nearest injector that provides it. `provideQubeeInstance()` returns the three service classes, so in a component's `providers` Angular creates new ones in that component's own injector, one set per component instance, created with the component and discarded with it. What they need to talk to your backend is not re-created: it is still looked up further up, at the environment injector.

Scoped to the component, one set per instance:

- `QubeeSignalStore`, the state: resource, filters, sorts, page, and the last page a response reported
- `QubeeQueryBuilder`: the mutators, and the `uri`, `currentPage`, `totalPages`… signals that read this store
- `QubeePaginator`: parses responses and syncs the page bounds into this store

Inherited from `provideQubee()`:

- `QUBEE_DRIVER`: the driver definition
- `QUBEE_REQUEST_STRATEGY` and `QUBEE_REQUEST_OPTIONS`: how URIs are written
- `QUBEE_RESPONSE_STRATEGY` and `QUBEE_RESPONSE_OPTIONS`: how responses are read
- `QUBEE_BASE_URL`: each new store starts from it

You still configure the library once, at bootstrap. `provideQubeeInstance()` configures no driver of its own; it inherits one, so `provideQubee()` must stay in your application providers.

**The re-fetch is the symptom.** `httpResource(() => qb.uri())` fetches again whenever `uri()` changes, and `uri()` is computed from the store's state. Components that share a store share that trigger: any mutation, from any of them, re-fetches all of them. With one store per component, a mutation changes only that component's `uri()`. The sync that `paginate()` performs after each response records the last page, which is not part of the URI, so it leaves `uri()` as it was and does not fetch again.

**Children share their host's instance.** `PagerComponent` declares no providers, so its `inject(QubeeQueryBuilder)` resolves to the instance of the list it is rendered in. That is why one pager component serves both lists, and why each shows its own list's bounds: `paginate()` wrote them into that list's store.

:::tip[A fresh state on every visit]
Because the instance lives and dies with the component, navigating away and back starts the list from a clean state. If a list should remember its filters across navigations, keep them in the URL with a [list](/guide/lists/) instead.
:::

## Variations

### The same component, several times

The instance belongs to the component **instance**, not to the class. A reusable table placed three times gets three builders:

```typescript title="order-table.component.ts"
import { Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import {
  PaginatedCollection,
  QubeePaginator,
  QubeeQueryBuilder,
  RawResponse,
  provideQubeeInstance
} from '@qubeejs/angular';

type Order = { id: number; reference: string };

@Component({
  selector: 'app-order-table',
  providers: [...provideQubeeInstance()],
  template: `
    <h2>{{ status() }}</h2>
    @for (order of page()?.data; track order.id) {
      <p>{{ order.reference }}</p>
    }
    <button type="button" [disabled]="qb.isLastPage()" (click)="qb.nextPage()">More</button>
  `
})
export class OrderTableComponent implements OnInit {
  private readonly _paginator = inject(QubeePaginator);
  private readonly _response = httpResource<RawResponse>(() => this.qb.uri());

  public readonly status = input.required<string>();

  protected readonly qb = inject(QubeeQueryBuilder);
  protected readonly page = signal<PaginatedCollection<Order> | undefined>(undefined);

  constructor() {
    effect(() => {
      if (this._response.hasValue()) {
        this.page.set(this._paginator.paginate<Order>(this._response.value()));
      }
    });
  }

  // Inputs are set by now; the constructor is too early to read one.
  public ngOnInit(): void {
    this.qb.setResource('orders').addFilter('status', this.status()).setLimit(5);
  }
}
```

```typescript title="order-board.component.ts"
import { Component } from '@angular/core';

import { OrderTableComponent } from './order-table.component';

@Component({
  selector: 'app-order-board',
  imports: [OrderTableComponent],
  template: `
    <app-order-table status="pending" />
    <app-order-table status="shipped" />
    <app-order-table status="delivered" />
  `
})
export class OrderBoardComponent {}
```

Each table fetches its own `/orders?filters[status][$eq]=…&pagination[page]=1&pagination[pageSize]=5`, and each "More" button pages one table only.

### Lists declared with `defineList()`

A list from [`defineList()`](/guide/lists/) builds every request on a fresh builder of its own, so it has no shared builder to scope and `provideQubeeInstance()` does not apply. Two such lists on one page share the **URL** instead. A param's state key is fixed (`page` is always `page`), but its URL key is yours to choose. Give each list its own keys, and each list's `request` changes only when its own params do:

```typescript title="lists.ts"
import { STRAPI_DRIVER, defineList, integerParam, stringParam } from '@qubeejs/angular';

const qubee = { baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER };

// Each list owns its own URL keys: ?customersPage=2&q=ada&ordersPage=3
export const customerList = defineList({
  apply: (builder, { q }) => {
    if (q) {
      builder.addFilter('name', q);
    }
  },
  params: {
    page: integerParam('customersPage', { default: 1, min: 1 }),
    q: stringParam('q')
  },
  qubee,
  resource: 'customers'
});

export const orderList = defineList({
  params: {
    page: integerParam('ordersPage', { default: 1, min: 1 })
  },
  qubee,
  resource: 'orders'
});
```

```typescript title="url-lists.component.ts"
import { Component } from '@angular/core';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { customerList, orderList } from './lists';

type Customer = { id: number; name: string };
type Order = { id: number; reference: string };

@Component({
  selector: 'app-url-lists',
  template: `
    @for (customer of customers.value()?.data; track customer.id) {
      <p>{{ customer.name }}</p>
    }
    <button type="button" (click)="customerList.setPage(customerList.state().page + 1)">
      More customers
    </button>

    @for (order of orders.value()?.data; track order.id) {
      <p>{{ order.reference }}</p>
    }
    <button type="button" (click)="orderList.setPage(orderList.state().page + 1)">More orders</button>
  `
})
export class UrlListsComponent {
  protected readonly customerList = injectQubeeList(customerList);
  protected readonly customers = qubeeHttpResource<Customer>(this.customerList.request);

  protected readonly orderList = injectQubeeList(orderList);
  protected readonly orders = qubeeHttpResource<Order>(this.orderList.request);
}
```

"More customers" navigates to `?customersPage=2` and fetches customers alone. "More orders" then adds `ordersPage=2` and fetches orders alone, keeping `customersPage` in the URL, since a list keeps the parameters it does not own.

When the second list should not be in the address bar at all, give it a memory adapter, and its state never reaches the URL:

```typescript
protected readonly orderList = injectQubeeList(orderList, { adapter: createQubeeMemoryAdapter() });
```

## Related

- [Per-component instances](/guide/per-component-instances/): `provideQubeeInstance()`, the store and the public injection tokens
- [Fetching data: why scope per component](/guide/fetching-data/#why-scope-per-component)
- [Pagination: syncing](/guide/pagination/#syncing): how `paginate()` feeds `totalPages()` and the page predicates
- [Lists in memory](/guide/lists/#lists-in-memory)
- [One builder per feature service](/recipes/feature-services/): the same isolation for root-scoped services
- [Building a query ↗](https://qubeejs.andreatantimonaco.me/guide/building-a-query/) and the [Strapi driver ↗](https://qubeejs.andreatantimonaco.me/drivers/reference/strapi/) in the core docs
