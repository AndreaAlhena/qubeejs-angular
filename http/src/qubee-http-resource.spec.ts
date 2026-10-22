import type { ListRequest } from '@qubeejs/angular';

import {
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpHeaders,
  provideHttpClient,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  buildListRequest,
  createQubeeMemoryAdapter,
  defineList,
  injectQubeeList,
  integerParam,
  PaginationModeEnum,
  POSTGREST_DRIVER,
  readListState,
  SPATIE_DRIVER,
  stringParam,
} from '@qubeejs/angular';

import { qubeeHttpResource } from './qubee-http-resource';

type Article = { id: number };

const articleList = defineList({
  apply: (builder, { q }) => {
    if (q) {
      builder.addFilter('title', q);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
  },
  qubee: { baseUrl: 'https://api.dev', driver: SPATIE_DRIVER },
  resource: 'articles',
});

const rangeList = defineList({
  params: { page: integerParam('page', { default: 1, min: 1 }) },
  qubee: {
    baseUrl: 'https://api.dev',
    driver: POSTGREST_DRIVER,
    pagination: PaginationModeEnum.RANGE,
  },
  resource: 'articles',
});

const spatiePage = (ids: number[], page: number): object => ({
  data: ids.map((id) => ({ id })),
  current_page: page,
  last_page: 3,
});

/**
 * Let the resource run its effects, issue its request or apply a response
 *
 * Not `whenStable()`: an unanswered request is pending work, so it would
 * wait for the very response the test is about to flush.
 */
const settle = async (): Promise<void> => {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
};

describe('qubeeHttpResource', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("should fetch the request and parse the page with the list's paginator", async () => {
    const articles = TestBed.runInInjectionContext(() => {
      const list = injectQubeeList(articleList, { adapter: createQubeeMemoryAdapter('page=2') });

      return qubeeHttpResource<Article>(list.request);
    });

    await settle();

    expect(articles.isLoading()).toBeTrue();
    expect(articles.value()).toBeUndefined();

    http.expectOne('https://api.dev/articles?limit=15&page=2').flush(spatiePage([1, 2], 2));
    await settle();

    expect(articles.isLoading()).toBeFalse();
    expect(articles.value()?.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(articles.value()?.page).toBe(2);
    expect(articles.value()?.lastPage).toBe(3);
  });

  it('should fetch again once per navigation, keeping the previous page meanwhile', async () => {
    const adapter = createQubeeMemoryAdapter();
    const { articles, list } = TestBed.runInInjectionContext(() => {
      const created = injectQubeeList(articleList, { adapter });

      return { articles: qubeeHttpResource<Article>(created.request), list: created };
    });

    await settle();
    http.expectOne('https://api.dev/articles?limit=15&page=1').flush(spatiePage([1], 1));
    await settle();

    list.set({ q: 'r' }, { debounce: 300 });
    list.set({ q: 're' }, { debounce: 300 });
    await settle();

    http.expectNone(() => true);

    list.set({ q: 're' });
    await settle();

    expect(articles.isLoading()).toBeTrue();
    expect(articles.value()?.data).toEqual([{ id: 1 }]);

    http
      .expectOne('https://api.dev/articles?filter[title]=re&limit=15&page=1')
      .flush(spatiePage([7], 1));
    await settle();

    expect(articles.value()?.data).toEqual([{ id: 7 }]);
  });

  it('should drop the previous page while loading with keepPreviousData: false', async () => {
    const adapter = createQubeeMemoryAdapter();
    const { articles, list } = TestBed.runInInjectionContext(() => {
      const created = injectQubeeList(articleList, { adapter });

      return {
        articles: qubeeHttpResource<Article>(created.request, { keepPreviousData: false }),
        list: created,
      };
    });

    await settle();
    http.expectOne(() => true).flush(spatiePage([1], 1));
    await settle();

    list.setPage(2);
    await settle();

    expect(articles.value()).toBeUndefined();

    http.expectOne(() => true).flush(spatiePage([2], 2));
    await settle();

    expect(articles.value()?.data).toEqual([{ id: 2 }]);
  });

  it('should fetch nothing while the request is null', async () => {
    const request = signal<ListRequest | null>(null);
    const articles = TestBed.runInInjectionContext(() => qubeeHttpResource<Article>(request));

    await settle();

    http.expectNone(() => true);
    expect(articles.value()).toBeUndefined();
    expect(articles.isLoading()).toBeFalse();

    request.set(buildListRequest(articleList, readListState(articleList, '')));
    await settle();

    http.expectOne('https://api.dev/articles?limit=15&page=1').flush(spatiePage([1], 1));
    await settle();

    expect(articles.value()?.data).toEqual([{ id: 1 }]);
  });

  it("should send the list's headers and parse the response's", async () => {
    const articles = TestBed.runInInjectionContext(() =>
      qubeeHttpResource<Article>(
        () => buildListRequest(rangeList, readListState(rangeList, '?page=2')),

        { init: { headers: { Prefer: 'count=exact', Range: 'overridden' } } }
      )
    );

    await settle();

    const call = http.expectOne('https://api.dev/articles');

    expect(call.request.headers.get('Prefer')).toBe('count=exact');
    expect(call.request.headers.get('Range')).toBe('15-29');

    call.flush(
      Array.from({ length: 15 }, (_, index) => ({ id: index + 16 })),
      { headers: { 'Content-Range': '15-29/31' } }
    );
    await settle();

    expect(articles.value()?.total).toBe(31);
    expect(articles.value()?.page).toBe(2);
  });

  it('should place a short last page on the page that was asked for', async () => {
    // A one-row last page: the Content-Range span (1) is not the page size (15).
    const articles = TestBed.runInInjectionContext(() =>
      qubeeHttpResource<Article>(() =>
        buildListRequest(rangeList, readListState(rangeList, '?page=3'))
      )
    );

    await settle();

    const call = http.expectOne('https://api.dev/articles');

    expect(call.request.headers.get('Range')).toBe('30-44');

    call.flush([{ id: 31 }], { headers: { 'Content-Range': '30-30/31' } });
    await settle();

    expect(articles.value()?.page).toBe(3);
    expect(articles.value()?.perPage).toBe(15);
    expect(articles.value()?.lastPage).toBe(3);
  });

  it('should merge into HttpHeaders and pass the other init options through', async () => {
    const token = new HttpContextToken(() => '');

    TestBed.runInInjectionContext(() =>
      qubeeHttpResource<Article>(
        () => buildListRequest(rangeList, readListState(rangeList, '')),

        {
          init: {
            context: new HttpContext().set(token, 'tag'),
            headers: new HttpHeaders({ 'X-App': 'qubee' }),
            withCredentials: true,
          },
        }
      )
    );

    await settle();

    const { request } = http.expectOne('https://api.dev/articles');

    expect(request.headers.get('X-App')).toBe('qubee');
    expect(request.headers.get('Range')).toBe('0-14');
    expect(request.withCredentials).toBeTrue();
    expect(request.context.get(token)).toBe('tag');
    http.expectNone(() => true);
  });

  it("should leave the caller's headers alone for a list that sends none", async () => {
    TestBed.runInInjectionContext(() =>
      qubeeHttpResource<Article>(
        () => buildListRequest(articleList, readListState(articleList, '')),

        { init: { headers: { 'X-App': 'qubee' } } }
      )
    );

    await settle();

    expect(http.expectOne(() => true).request.headers.get('X-App')).toBe('qubee');
  });

  it('should report a failure, with no page, and recover on reload', async () => {
    const articles = TestBed.runInInjectionContext(() =>
      qubeeHttpResource<Article>(() =>
        buildListRequest(articleList, readListState(articleList, ''))
      )
    );

    await settle();
    http.expectOne(() => true).flush('nope', { status: 500, statusText: 'Server Error' });
    await settle();

    expect(articles.error()).toBeInstanceOf(HttpErrorResponse);
    expect(articles.value()).toBeUndefined();

    expect(articles.reload()).toBeTrue();
    await settle();
    http.expectOne(() => true).flush(spatiePage([1], 1));
    await settle();

    expect(articles.error()).toBeUndefined();
    expect(articles.value()?.data).toEqual([{ id: 1 }]);
  });

  it('should expose the underlying resource', async () => {
    const articles = TestBed.runInInjectionContext(() =>
      qubeeHttpResource<Article>(() =>
        buildListRequest(articleList, readListState(articleList, ''))
      )
    );

    await settle();
    http.expectOne(() => true).flush(spatiePage([], 1));
    await settle();

    expect(articles.resource.statusCode()).toBe(200);
  });

  it('should run outside an injection context with an injector, and throw without one', () => {
    const request = (): null => null;

    expect(() =>
      qubeeHttpResource(request, { injector: TestBed.inject(EnvironmentInjector) })
    ).not.toThrow();
    expect(() => qubeeHttpResource(request)).toThrowError(/injection context/);
  });
});
