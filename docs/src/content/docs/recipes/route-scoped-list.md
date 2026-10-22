---
title: A list scoped by a route parameter
description: Fetch a project's tasks at /projects/:projectId/tasks?status=open, with the project id passed to the list as a typed input and the filters kept in the query.
---

At `/projects/42/tasks?status=open`, the page shows the open tasks of project 42. The filter and the page belong in the query string, where a [list](/guide/lists/) keeps them, but the project id is part of the **path**. It decides which resource the list fetches, so it can't be one of the list's params. A list declares what its request needs besides the URL as its **input**. This recipe feeds that input from a component input bound to the route parameter, and fetches with `qubeeHttpResource()`.

## The problem

A list's params are read from the query string, so the project id has to reach the request some other way. The tempting shortcut is to read it from the route once and bake it into the resource:

```typescript title="tasks.component.ts"
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { STRAPI_DRIVER, defineList, enumParam, injectQubeeList, integerParam } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { Task } from './task-list';

@Component({
  selector: 'app-tasks',
  template: `
    @for (task of tasks.value()?.data; track task.id) {
      <p>{{ task.title }}</p>
    }
  `
})
export class TasksComponent {
  // Read once, when the component is created
  private readonly _projectId = inject(ActivatedRoute).snapshot.paramMap.get('projectId') ?? '';

  protected readonly list = injectQubeeList(
    defineList({
      apply: (builder, { status }) => {
        builder.setLimit(20);

        if (status) {
          builder.addFilter('status', status);
        }
      },
      params: {
        page: integerParam('page', { default: 1, min: 1 }),
        status: enumParam('status', ['open', 'done'])
      },
      qubee: { baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER },
      resource: `projects/${encodeURIComponent(this._projectId)}/tasks`
    })
  );

  protected readonly tasks = qubeeHttpResource<Task>(this.list.request);
}
```

The first visit, `/projects/42/tasks`, works. Then the user follows a link to `/projects/7/tasks`. That URL matches the same route, so Angular **reuses** the component instead of creating a new one: the snapshot was read once, and the list was defined once. Nothing is fetched, and the page goes on showing project 42's tasks under project 7's URL. The query still works, so `/projects/7/tasks?status=open` then fetches `/projects/42/tasks?filters[status][$eq]=open…`, the open tasks of the wrong project. The list is also defined inside the component, while a list is meant to be declared once, as a module-level constant.

## The solution

### 1. Declare the input

Annotate the third parameter of `apply`. That annotation is the declaration: it types the input, and it makes `injectQubeeList()` require one.

```typescript title="task-list.ts"
import { STRAPI_DRIVER, defineList, enumParam, integerParam } from '@qubeejs/angular';

export type Task = { id: number; title: string; status: 'open' | 'done' };

export const taskList = defineList({
  // The third parameter's annotation declares the list's input.
  apply: (builder, { status }, { projectId }: { projectId: string }) => {
    // The resource is not encoded: encode the segment that comes from the URL.
    builder.setResource(`projects/${encodeURIComponent(projectId)}/tasks`).setLimit(20);

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    status: enumParam('status', ['open', 'done'])
  },
  qubee: { baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER },
  resource: 'tasks'
});
```

`resource: 'tasks'` is the default, replaced by `apply` on every request. The resource is emitted as it is written, so the path segment that comes from the URL is encoded with `encodeURIComponent()`.

### 2. Bind the route parameter to a component input

`withComponentInputBinding()` sets a routed component's inputs from the route's path parameters (and query parameters, and resolved data):

```typescript title="app.routes.ts"
import { Routes } from '@angular/router';

import { TasksComponent } from './tasks.component';

export const routes: Routes = [{ path: 'projects/:projectId/tasks', component: TasksComponent }];
```

```typescript title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideQubeeRouterAdapter } from '@qubeejs/angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes, withComponentInputBinding()),
    provideQubeeRouterAdapter()
  ]
};
```

`provideQubeeRouterAdapter()` comes from `@qubeejs/angular/router` and lets lists read and write the URL through the Angular Router. A list carries its own `qubee` configuration, so it needs no `provideQubee()`.

### 3. Pass the input, fetch the request

```typescript title="tasks.component.ts"
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { Task, taskList } from './task-list';

@Component({
  selector: 'app-tasks',
  imports: [RouterLink],
  template: `
    <nav>
      <a [routerLink]="router.parseUrl(list.href({ status: undefined }))">All</a>
      <a [routerLink]="router.parseUrl(list.href({ status: 'open' }))">Open</a>
      <a [routerLink]="router.parseUrl(list.href({ status: 'done' }))">Done</a>
    </nav>

    @if (tasks.error()) {
      <p>Could not load the tasks of project {{ projectId() }}.</p>
    } @else {
      <ul [attr.aria-busy]="tasks.isLoading()">
        @for (task of tasks.value()?.data; track task.id) {
          <li>{{ task.title }}</li>
        } @empty {
          @if (!tasks.isLoading()) {
            <li>No tasks.</li>
          }
        }
      </ul>
    }

    <button type="button" [disabled]="list.state().page === 1" (click)="list.setPage(list.state().page - 1)">
      Previous
    </button>
    <button
      type="button"
      [disabled]="list.state().page >= (tasks.value()?.lastPage ?? 1)"
      (click)="list.setPage(list.state().page + 1)"
    >
      Next
    </button>
  `
})
export class TasksComponent {
  /** Bound from `:projectId` by withComponentInputBinding() */
  public readonly projectId = input.required<string>();

  protected readonly router = inject(Router);

  protected readonly list = injectQubeeList(taskList, {
    input: () => ({ projectId: this.projectId() })
  });

  protected readonly tasks = qubeeHttpResource<Task>(this.list.request);
}
```

At `/projects/42/tasks?status=open`, the component fetches `https://api.example.com/projects/42/tasks?filters[status][$eq]=open&pagination[page]=1&pagination[pageSize]=20`. "Next" navigates to `/projects/42/tasks?page=2&status=open` and fetches page 2. The filter links point at `/projects/42/tasks`, `?status=open` and `?status=done`. `list.href()` keeps the current path, so the links stay inside the project.

## Why it works

- **The input reaches the request, never the URL.** `injectQubeeList()` passes it as the third argument to `apply` when it builds `request`. The URL still holds only `status` and `page`, and the links that `href()` builds keep the path they were built on.
- **The input is a function, so it is tracked.** `input: () => ({ projectId: this.projectId() })` reads a signal, and `request` is computed from it. Navigating from project 42 to project 7 reuses the component, since the route is the same, and changes only its `projectId` input: `request` changes, and `qubeeHttpResource()` fetches `/projects/7/tasks?…`, aborting the previous request if it is still in flight. An input that is equal to the previous one keeps the same `request`, so nothing fetches again.
- **The input is type-checked.** With the annotation on `apply`, leaving `input` out of `injectQubeeList()` is a compile error, and so is passing one of the wrong shape. A list that declares no input refuses one. `ListInput<typeof taskList>` names the type, `{ projectId: string }`.
- **The query still drives the list.** `status` and `page` come from the query string through the router adapter, with all of a list's behaviour: values equal to their defaults stay out of the URL, a filter change returns to page 1, and Back and Forward work.

:::caution[Required inputs are read lazily]
A required input has no value in the constructor. `qubeeHttpResource()` first reads `request` after the inputs are set, so the code above is safe. But reading `this.list.request()` yourself in the constructor or in a field initialiser throws `NG0950`. Read it in the template, in `computed()` or `effect()`, or from `ngOnInit()` on.
:::

## Variations

### `null` while the input is not ready

Return `null` from the input function, and the list is not ready: `request()` is `null`, and `qubeeHttpResource()` fetches nothing until the input has a value. That suits a component whose input is optional, here a panel that shows the tasks of whichever project its parent has picked. The panel's list belongs to the panel rather than to the page, so it keeps its state in memory:

```typescript title="task-panel.component.ts"
import { Component, input } from '@angular/core';
import { createQubeeMemoryAdapter, injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { Task, taskList } from './task-list';

@Component({
  selector: 'app-task-panel',
  template: `
    @if (list.request() === null) {
      <p>Pick a project.</p>
    } @else {
      @for (task of tasks.value()?.data; track task.id) {
        <p>{{ task.title }}</p>
      }
    }
  `
})
export class TaskPanelComponent {
  /** Unset until the parent has picked a project */
  public readonly projectId = input<string>();

  protected readonly list = injectQubeeList(taskList, {
    adapter: createQubeeMemoryAdapter(),
    input: () => {
      const projectId = this.projectId();

      return projectId ? { projectId } : null;
    }
  });

  protected readonly tasks = qubeeHttpResource<Task>(this.list.request);
}
```

Read the signal once into a local constant, as above, so that TypeScript narrows it from `string | undefined` to `string`. The panel fetches nothing until the parent passes `[projectId]`, then `/projects/5/tasks?…`.

### Without input binding

`withComponentInputBinding()` binds inputs only on routed components. Elsewhere, or if you would rather not turn it on, read the parameter from `ActivatedRoute`. `paramMap.get()` returns `string | null`, and when it is `null` the input function returns `null`:

```typescript title="tasks.component.ts"
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';
import { map } from 'rxjs';

import { Task, taskList } from './task-list';

@Component({
  selector: 'app-tasks',
  template: `
    @for (task of tasks.value()?.data; track task.id) {
      <p>{{ task.title }}</p>
    }
  `
})
export class TasksComponent {
  private readonly _projectId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('projectId'))),
    { initialValue: null }
  );

  protected readonly list = injectQubeeList(taskList, {
    input: () => {
      const projectId = this._projectId();

      return projectId ? { projectId } : null;
    }
  });

  protected readonly tasks = qubeeHttpResource<Task>(this.list.request);
}
```

The same `request` and the same fetch follow, and a navigation to another project emits a new `paramMap`.

## Related

- [Lists that need more than the URL](/guide/lists/#lists-that-need-more-than-the-url), in the guide
- [Lists in the URL](/guide/lists/): adapters, the list handle and links
- [Fetching a list](/guide/fetching-data/#fetching-a-list) with `qubeeHttpResource()`
- [Testing a list component](/recipes/testing-lists/), including a routed component with `RouterTestingHarness`
- [Lists & URL state: lists that need more than the URL ↗](https://qubeejs.andreatantimonaco.me/guide/lists/#lists-that-need-more-than-the-url) and the [Strapi driver ↗](https://qubeejs.andreatantimonaco.me/drivers/reference/strapi/) in the core docs
