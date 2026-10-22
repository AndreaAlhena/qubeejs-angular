---
title: Testing a list component
description: Test a component built on injectQubeeList() and qubeeHttpResource() with the memory adapter and HttpTestingController, with no router and no backend.
---

A list component reads its state from the URL through an adapter and fetches with `qubeeHttpResource()`. A unit test should need neither a real router nor a real backend, yet it should check what users rely on: that the right request goes out, that the page is rendered, and that a click navigates where it should. The memory adapter stands in for the URL, and `HttpTestingController` stands in for the backend. The component itself does not change.

## The problem

Here is the component to test: a search box, a page of articles, and a "Next" button. The list is declared once:

```typescript title="article-list.ts"
import { STRAPI_DRIVER, SortEnum, defineList, enumParam, integerParam, stringParam } from '@qubeejs/angular';

export type Article = { id: number; title: string };

export const articleList = defineList({
  apply: (builder, { q, status }) => {
    builder.setLimit(10).addSort('publishedAt', SortEnum.DESC);

    if (q) {
      builder.addFilter('title', q);
    }

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
    status: enumParam('status', ['draft', 'published'])
  },
  qubee: { baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER },
  resource: 'articles'
});
```

```typescript title="articles.component.ts"
import { Component } from '@angular/core';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { Article, articleList } from './article-list';

@Component({
  selector: 'app-articles',
  template: `
    <input aria-label="Search" [value]="list.state().q ?? ''" (input)="search($event)" />

    @if (articles.error()) {
      <p role="alert">Could not load the articles.</p>
    }

    <ul>
      @for (article of articles.value()?.data; track article.id) {
        <li>{{ article.title }}</li>
      }
    </ul>

    <button
      type="button"
      [disabled]="list.state().page >= (articles.value()?.lastPage ?? 1)"
      (click)="list.setPage(list.state().page + 1)"
    >
      Next
    </button>
  `
})
export class ArticlesComponent {
  protected readonly list = injectQubeeList(articleList);
  protected readonly articles = qubeeHttpResource<Article>(this.list.request);

  protected search(event: Event): void {
    this.list.set({ q: (event.target as HTMLInputElement).value }, { debounce: 300, replace: true });
  }
}
```

In the application, `provideQubeeRouterAdapter()` sits next to `provideRouter()`. A test that creates the component with neither throws at once:

```text
MissingRouterAdapterError: injectQubeeList() found no adapter. Provide one — provideQubeeRouterAdapter() from '@qubeejs/angular/router', provideQubeeBrowserAdapter() or provideQubeeMemoryAdapter() — or pass { adapter } to injectQubeeList().
```

You could set up the router and drive it with navigations in every test. But the component never names the router: it reads a location signal and calls `navigate()`, and any adapter can answer those calls.

## The solution

### Test the definition without Angular

The definition is plain data and pure functions, so most of what a list does can be checked without `TestBed`: how a URL reads, which request a state makes, and which link a change produces.

```typescript title="article-list.spec.ts"
import { buildListHref, buildListRequest, readListState } from '@qubeejs/angular';

import { articleList } from './article-list';

describe('articleList', () => {
  it('reads its state from a URL, falling back to defaults', () => {
    expect(readListState(articleList, '?q=angular&status=archived&page=0')).toEqual({
      page: 1,
      q: 'angular',
      status: undefined
    });
  });

  it('builds the request for a state', () => {
    const request = buildListRequest(articleList, readListState(articleList, '?q=angular&page=2'));

    expect(request.uri).toBe(
      'https://api.example.com/articles?filters[title][$eq]=angular&sort[0]=publishedAt:desc&pagination[page]=2&pagination[pageSize]=10'
    );
  });

  it('keeps defaults out of the URL and returns to page 1 on a filter change', () => {
    const location = { pathname: '/articles', search: '?page=3' };

    expect(buildListHref(articleList, location, { status: 'draft' })).toBe('/articles?status=draft');
  });
});
```

### Test the component with the memory adapter

Provide a memory adapter under `QUBEE_LIST_ADAPTER`, and keep a reference to it: its `location()` is the URL the component sees, and its `navigate()` is how the test moves that URL the way Back or a link would. `provideHttpClientTesting()` catches every request `qubeeHttpResource()` makes, so the test can assert its exact URI and answer it.

```typescript title="articles.component.spec.ts"
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QUBEE_LIST_ADAPTER, QubeeListAdapter, createQubeeMemoryAdapter } from '@qubeejs/angular';

import { ArticlesComponent } from './articles.component';

const API = 'https://api.example.com/articles';

/** A Strapi page of articles */
const strapiPage = (titles: string[], page: number, pageCount: number): object => ({
  data: titles.map((title, index) => ({ id: page * 100 + index, title })),
  meta: { pagination: { page, pageCount, pageSize: 10, total: pageCount * 10 } }
});

describe('ArticlesComponent', () => {
  let adapter: QubeeListAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    adapter = createQubeeMemoryAdapter('?status=published');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: QUBEE_LIST_ADAPTER, useValue: adapter }
      ]
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('fetches the page the URL asks for and renders it', async () => {
    const fixture = TestBed.createComponent(ArticlesComponent);

    TestBed.tick();

    http
      .expectOne(
        `${API}?filters[status][$eq]=published&sort[0]=publishedAt:desc&pagination[page]=1&pagination[pageSize]=10`
      )
      .flush(strapiPage(['Signals', 'Zoneless'], 1, 3));
    await fixture.whenStable();

    const items = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;

    expect(Array.from(items, (item) => item.textContent)).toEqual(['Signals', 'Zoneless']);
  });

  it('navigates to the next page and fetches it', async () => {
    const fixture = TestBed.createComponent(ArticlesComponent);

    TestBed.tick();
    http.expectOne(() => true).flush(strapiPage(['Signals'], 1, 3));
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    TestBed.tick();

    expect(adapter.location().search).toBe('?page=2&status=published');
    http
      .expectOne(
        `${API}?filters[status][$eq]=published&sort[0]=publishedAt:desc&pagination[page]=2&pagination[pageSize]=10`
      )
      .flush(strapiPage(['Resources'], 2, 3));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('li')?.textContent).toBe('Resources');
  });

  it('follows a navigation it did not start', async () => {
    const fixture = TestBed.createComponent(ArticlesComponent);

    TestBed.tick();
    http.expectOne(() => true).flush(strapiPage(['Signals'], 1, 3));
    await fixture.whenStable();

    // What Back, Forward or a link elsewhere would do to the URL
    adapter.navigate('?page=3', { replace: false });
    TestBed.tick();

    http
      .expectOne(`${API}?sort[0]=publishedAt:desc&pagination[page]=3&pagination[pageSize]=10`)
      .flush(strapiPage(['Testing'], 3, 3));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('li')?.textContent).toBe('Testing');
  });

  it('waits for the debounce before it navigates and fetches', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(ArticlesComponent);

    TestBed.tick();
    http.expectOne(() => true).flush(strapiPage(['Signals'], 1, 3));

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'zone';
    input.dispatchEvent(new Event('input'));
    TestBed.tick();

    expect(adapter.location().search).toBe('?status=published');
    http.expectNone(() => true);

    vi.advanceTimersByTime(300);
    TestBed.tick();

    expect(adapter.location().search).toBe('?q=zone&status=published');
    http
      .expectOne(
        `${API}?filters[title][$eq]=zone&filters[status][$eq]=published&sort[0]=publishedAt:desc&pagination[page]=1&pagination[pageSize]=10`
      )
      .flush(strapiPage([], 1, 1));
  });

  it('shows an error when the request fails', async () => {
    const fixture = TestBed.createComponent(ArticlesComponent);

    TestBed.tick();
    http.expectOne(() => true).flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
```

The file is written for Vitest, which `ng new` sets up. It runs with `ng test`.

## Why it works

- **The component names no router.** `injectQubeeList()` reads `QUBEE_LIST_ADAPTER`, whichever adapter is provided. The memory adapter keeps the location in a signal and moves it on `navigate()`. Typed state, `set()`, the debounce and `request` all behave as they do with the URL. The only difference is that there is no history.
- **`TestBed.tick()` lets the request out.** `qubeeHttpResource()` is built on `httpResource()`, which issues its request from an effect. `TestBed.tick()` runs pending effects and change detection, after which `expectOne()` finds the request.
- **`expectOne(uri)` is the assertion.** The URI carries the whole state: the filters, the sort, the page and the page size. Matching it exactly checks the list definition, the URL state and the driver together. `http.verify()` in `afterEach` fails the test on any request nobody expected, such as a second fetch after a debounce.
- **`whenStable()` comes after `flush()`, never before.** A request that has not been answered is pending work, so `fixture.whenStable()` waits for it, and keeps waiting until the test flushes it. Flush first, then `await fixture.whenStable()` to render the response.
- **The location is the navigation.** The adapter is the URL, so `adapter.location().search` tells you where a click went, with no router spy. Its params appear in the order the list declares them (`page`, `q`, `status`), and values equal to their defaults are left out.
- **Fake timers drive the debounce.** `set()` with `debounce: 300` updates `state` at once and navigates after 300 ms of quiet. With `vi.useFakeTimers()`, the test can check that nothing navigated or fetched before then, and that one navigation and one fetch happen after. `afterEach` restores real timers even if the test fails.

:::note[Karma and Jasmine]
On a project that still runs Karma, only the debounce test needs changing: install `jasmine.clock()` in place of `vi.useFakeTimers()`, call `jasmine.clock().tick(300)` in place of `vi.advanceTimersByTime(300)`, and uninstall the clock afterwards.
:::

## Variations

### Provide the adapter instead of creating it

`provideQubeeMemoryAdapter(initialSearch)` registers a new memory adapter under `QUBEE_LIST_ADAPTER`. `TestBed.inject()` hands back the same instance the component uses:

```typescript title="articles-drafts.spec.ts"
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QUBEE_LIST_ADAPTER, provideQubeeMemoryAdapter } from '@qubeejs/angular';

import { ArticlesComponent } from './articles.component';

describe('ArticlesComponent, drafts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideQubeeMemoryAdapter('status=draft&page=2')
      ]
    });
  });

  it('starts from the query it is given', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ArticlesComponent);

    TestBed.tick();
    http
      .expectOne(
        'https://api.example.com/articles?filters[status][$eq]=draft&sort[0]=publishedAt:desc&pagination[page]=2&pagination[pageSize]=10'
      )
      .flush({ data: [], meta: { pagination: { page: 2, pageCount: 3, pageSize: 10, total: 30 } } });
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(TestBed.inject(QUBEE_LIST_ADAPTER).location().search).toBe('?page=3&status=draft');

    TestBed.tick();
    http.expectOne(() => true).flush({ data: [] });
    http.verify();
  });
});
```

The initial query takes any shape `readListState()` takes: a string with or without its `?`, `URLSearchParams`, or a record.

### A routed component, against the real router

To test what the memory adapter leaves out (path parameters bound with `withComponentInputBinding()`, `routerLink`s, guards), keep the real router and its adapter, and drive them with `RouterTestingHarness`. Here is the `TasksComponent` from [A list scoped by a route parameter](/recipes/route-scoped-list/):

```typescript title="tasks.component.spec.ts"
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideQubeeRouterAdapter } from '@qubeejs/angular/router';

import { TasksComponent } from './tasks.component';

const emptyPage = { data: [], meta: { pagination: { page: 1, pageCount: 0, pageSize: 20, total: 0 } } };

describe('TasksComponent, routed', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(
          [{ path: 'projects/:projectId/tasks', component: TasksComponent }],
          withComponentInputBinding()
        ),
        provideQubeeRouterAdapter()
      ]
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches the tasks of the project in the path', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/projects/42/tasks?status=open');

    http
      .expectOne(
        'https://api.example.com/projects/42/tasks?filters[status][$eq]=open&pagination[page]=1&pagination[pageSize]=20'
      )
      .flush({
        data: [{ id: 1, title: 'Write the docs', status: 'open' }],
        meta: { pagination: { page: 1, pageCount: 1, pageSize: 20, total: 1 } }
      });
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('li')?.textContent).toBe('Write the docs');
  });

  it('fetches again when the project changes', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/projects/42/tasks');
    http.expectOne(() => true).flush(emptyPage);

    // Same route, so the component is reused and only its input changes.
    await harness.navigateByUrl('/projects/7/tasks');
    http
      .expectOne('https://api.example.com/projects/7/tasks?pagination[page]=1&pagination[pageSize]=20')
      .flush(emptyPage);
  });
});
```

`harness.navigateByUrl()` resolves once the routed component is on screen, with its request issued and not yet answered. As before, flush first, then wait for stability.

### A component that brings its own adapter

A component that passes `{ adapter: createQubeeMemoryAdapter() }` to `injectQubeeList()` keeps that adapter to itself, so a test cannot provide another one or read its location. Test it through its template and its inputs. If a test needs to reach the adapter, provide it in the component's `providers` with `provideQubeeMemoryAdapter()` instead. The component behaves the same, and a test can swap in an adapter it holds with `TestBed.overrideComponent(TheComponent, { set: { providers: [{ provide: QUBEE_LIST_ADAPTER, useValue: adapter }] } })`. `set` replaces the component's whole `providers` array, so list any other providers it needs there too.

## Related

- [Lists in the URL](/guide/lists/): adapters, the list handle, [lists in memory](/guide/lists/#lists-in-memory)
- [Fetching a list](/guide/fetching-data/#fetching-a-list) with `qubeeHttpResource()`
- [A list scoped by a route parameter](/recipes/route-scoped-list/)
- [`createQubeeMemoryAdapter()`](/api/lists/create-qubee-memory-adapter/) and [`provideQubeeMemoryAdapter()`](/api/lists/provide-qubee-memory-adapter/) in the API reference
- [Lists & URL state ↗](https://qubeejs.andreatantimonaco.me/guide/lists/) in the core docs, for `readListState()`, `buildListRequest()` and `buildListHref()`
