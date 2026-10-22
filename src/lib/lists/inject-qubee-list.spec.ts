import type { ListLocation } from '@qubeejs/core';

import { DOCUMENT } from '@angular/common';
import { createEnvironmentInjector, EnvironmentInjector, signal } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import {
  defineList,
  enumParam,
  integerParam,
  PaginationModeEnum,
  POSTGREST_DRIVER,
  SortEnum,
  sortParam,
  SPATIE_DRIVER,
  stringParam,
} from '@qubeejs/core';

import type { QubeeListAdapter, QubeeListNavigateOptions } from '../types/qubee-list-adapter.type';

import { MissingRouterAdapterError } from '../errors/missing-router-adapter.error';
import { QUBEE_LIST_ADAPTER } from '../tokens/qubee.tokens';
import { parseHref } from '../utils/parse-href';
import { injectQubeeList } from './inject-qubee-list';
import { provideQubeeMemoryAdapter } from './memory-adapter';

const articleList = defineList({
  apply: (builder, { q, sort, status }) => {
    builder.setLimit(20);
    sort.forEach(({ field, order }) => builder.addSort(field, order));

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
    status: enumParam('status', ['draft', 'published']),
    sort: sortParam('sort', { fields: ['publishedAt', 'title'] }),
  },
  qubee: { baseUrl: 'https://api.dev', driver: SPATIE_DRIVER },
  resource: 'articles',
});

const taskList = defineList({
  apply: (builder, { status }, { projectId }: { projectId: string }) => {
    builder.addFilter('project', projectId);

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    status: enumParam('status', ['open', 'done']),
  },
  qubee: { driver: SPATIE_DRIVER },
  resource: 'tasks',
});

type Navigation = { href: string } & QubeeListNavigateOptions;

/**
 * An adapter whose location the test moves by hand, recording every navigation
 */
const fakeAdapter = (
  url = '/articles'
): {
  adapter: QubeeListAdapter;
  go: (href: string) => void;
  navigations: Navigation[];
} => {
  const location = signal<ListLocation>(parseHref(url));
  const navigations: Navigation[] = [];

  return {
    adapter: {
      location: location.asReadonly(),
      navigate: (href, options): void => {
        navigations.push({ href, ...options });
        location.set(parseHref(href));
      },
    },
    go: (href) => location.set(parseHref(href)),
    navigations,
  };
};

describe('injectQubeeList', () => {
  describe('setup', () => {
    it('should throw MissingRouterAdapterError without an adapter', () => {
      expect(() => TestBed.runInInjectionContext(() => injectQubeeList(articleList))).toThrowError(
        MissingRouterAdapterError
      );
    });

    it('should use the adapter provided under QUBEE_LIST_ADAPTER', () => {
      TestBed.configureTestingModule({ providers: [provideQubeeMemoryAdapter('q=react')] });

      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList));

      expect(list.state().q).toBe('react');
    });

    it('should prefer the adapter passed in the options', () => {
      const { adapter } = fakeAdapter('/articles?status=draft');

      TestBed.configureTestingModule({ providers: [provideQubeeMemoryAdapter('q=react')] });

      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      expect(list.state().q).toBeUndefined();
      expect(list.state().status).toBe('draft');
    });

    it('should run outside an injection context with an injector', () => {
      const { adapter } = fakeAdapter();
      const list = injectQubeeList(articleList, {
        adapter,
        injector: TestBed.inject(EnvironmentInjector),
      });

      expect(list.state().page).toBe(1);
    });

    it('should throw outside an injection context without an injector', () => {
      const { adapter } = fakeAdapter();

      expect(() => injectQubeeList(articleList, { adapter })).toThrowError(/injection context/);
    });
  });

  describe('state', () => {
    it('should read the URL, with defaults for what it lacks or cannot read', () => {
      const { adapter } = fakeAdapter('/articles?q=react&sort=-title&page=banana');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      expect(list.state()).toEqual({
        page: 1,
        q: 'react',
        sort: [{ field: 'title', order: SortEnum.DESC }],
        status: undefined,
      });
    });

    it('should follow navigations made elsewhere', () => {
      const { adapter, go } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      go('/articles?page=3');

      expect(list.state().page).toBe(3);
    });
  });

  describe('set', () => {
    it('should navigate once, returning to page 1 and keeping foreign keys', () => {
      const { adapter, navigations } = fakeAdapter('/articles?panel=edit&page=3');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ q: 'react', status: 'draft' });

      expect(navigations).toEqual([
        { href: '/articles?panel=edit&q=react&status=draft', replace: false },
      ]);
      expect(list.state().page).toBe(1);
      expect(list.state().q).toBe('react');
    });

    it('should pass replace to the adapter', () => {
      const { adapter, navigations } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ q: 'react' }, { replace: true });

      expect(navigations[0].replace).toBeTrue();
    });

    it('should not navigate when nothing changes', () => {
      const { adapter, navigations } = fakeAdapter('/articles?q=react');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ q: 'react' });

      expect(navigations).toEqual([]);
    });

    it('should page with setPage()', () => {
      const { adapter, navigations } = fakeAdapter('/articles?q=react');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.setPage(2);

      expect(navigations[0].href).toBe('/articles?page=2&q=react');
      expect(list.state().page).toBe(2);
    });
  });

  describe('debounce', () => {
    it('should update state at once and navigate once after the quiet period', fakeAsync(() => {
      const { adapter, navigations } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));
      const firstRequest = list.request();

      list.set({ q: 'r' }, { debounce: 300 });
      tick(200);
      list.set({ q: 're' }, { debounce: 300 });

      expect(list.state().q).toBe('re');
      expect(list.isPending()).toBeTrue();
      expect(list.request()).toBe(firstRequest);
      expect(navigations).toEqual([]);

      tick(300);

      expect(navigations).toEqual([{ href: '/articles?q=re', replace: false }]);
      expect(list.isPending()).toBeFalse();
      expect(list.request().uri).toContain('filter[title]=re');
    }));

    it('should commit at once when the same change comes without a debounce', fakeAsync(() => {
      const { adapter, navigations } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ q: 'react' }, { debounce: 300 });
      list.set({ q: 'react' });

      expect(navigations).toEqual([{ href: '/articles?q=react', replace: false }]);

      tick(300);

      expect(navigations.length).toBe(1);
    }));

    it('should build href() from the draft', fakeAsync(() => {
      const { adapter } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ q: 'react' }, { debounce: 300 });

      expect(list.href({ status: 'draft' })).toBe('/articles?q=react&status=draft');

      tick(300);
    }));

    it('should drop the draft and cancel the navigation when the URL changes elsewhere', fakeAsync(() => {
      const { adapter, go, navigations } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ q: 'react' }, { debounce: 300 });
      go('/articles?status=published');

      expect(list.state().q).toBeUndefined();
      expect(list.state().status).toBe('published');
      expect(list.isPending()).toBeFalse();

      tick(300);

      expect(navigations).toEqual([]);
    }));

    it('should cancel when the value goes back to what the URL shows', fakeAsync(() => {
      const { adapter, navigations } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ q: 'r' }, { debounce: 300 });
      list.set({ q: undefined }, { debounce: 300 });

      expect(list.isPending()).toBeFalse();

      tick(300);

      expect(navigations).toEqual([]);
    }));

    it('should commit at once when a link is clicked', fakeAsync(() => {
      const { adapter, navigations } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));
      const link = TestBed.inject(DOCUMENT).createElement('a');

      link.href = '#elsewhere';
      link.addEventListener('click', (event) => event.preventDefault());
      TestBed.inject(DOCUMENT).body.appendChild(link);

      list.set({ q: 'react' }, { debounce: 300, replace: true });
      link.click();

      expect(navigations).toEqual([{ href: '/articles?q=react', replace: true }]);

      link.remove();
      tick(300);

      expect(navigations.length).toBe(1);
    }));

    it('should cancel when the injector is destroyed', fakeAsync(() => {
      const { adapter, navigations } = fakeAdapter();
      const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
      const list = injectQubeeList(articleList, { adapter, injector });

      list.set({ q: 'react' }, { debounce: 300 });
      injector.destroy();
      tick(300);

      expect(navigations).toEqual([]);
    }));
  });

  describe('asynchronous navigation', () => {
    it('should stay pending until the navigation settles', fakeAsync(() => {
      const location = signal<ListLocation>(parseHref('/articles'));
      let land = (): void => undefined;
      const adapter: QubeeListAdapter = {
        location,
        navigate: (href) =>
          new Promise<void>((resolve) => {
            land = (): void => {
              location.set(parseHref(href));
              resolve();
            };
          }),
      };
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.setPage(2);

      expect(list.state().page).toBe(2);
      expect(list.isPending()).toBeTrue();
      expect(list.request().uri).toContain('page=1');

      land();
      flushMicrotasks();

      expect(list.isPending()).toBeFalse();
      expect(list.request().uri).toContain('page=2');
    }));

    it('should keep a newer draft when an earlier navigation lands', fakeAsync(() => {
      const location = signal<ListLocation>(parseHref('/articles'));
      const pending: (() => void)[] = [];
      const adapter: QubeeListAdapter = {
        location,
        navigate: (href) =>
          new Promise<void>((resolve) => {
            pending.push(() => {
              location.set(parseHref(href));
              resolve();
            });
          }),
      };
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.set({ status: 'draft' });
      list.set({ q: 'react' }, { debounce: 300 });
      pending[0]();
      flushMicrotasks();

      expect(list.state()).toEqual(jasmine.objectContaining({ q: 'react', status: 'draft' }));
      expect(list.isPending()).toBeTrue();

      tick(300);
      pending[1]();
      flushMicrotasks();

      expect(location().search).toBe('?q=react&status=draft');
      expect(list.isPending()).toBeFalse();
    }));

    it('should not stay pending when the adapter throws', () => {
      const location = signal<ListLocation>(parseHref('/articles'));
      const adapter: QubeeListAdapter = {
        location,
        navigate: () => {
          throw new Error('boom');
        },
      };
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      expect(() => list.setPage(2)).toThrowError('boom');
      expect(list.isPending()).toBeFalse();
      expect(list.state().page).toBe(1);
    });

    it('should drop the draft when the navigation does not land', fakeAsync(() => {
      const location = signal<ListLocation>(parseHref('/articles'));
      const adapter: QubeeListAdapter = { location, navigate: () => Promise.resolve(false) };
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.setPage(2);
      flushMicrotasks();

      expect(list.state().page).toBe(1);
      expect(list.isPending()).toBeFalse();
    }));
  });

  describe('request', () => {
    it('should describe the state in the URL', () => {
      const { adapter } = fakeAdapter('/articles?q=react&page=2');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));
      const { headers, uri } = list.request();

      expect(uri).toBe('https://api.dev/articles?filter[title]=react&limit=20&page=2');
      expect(headers).toBeNull();
    });

    it('should keep its identity when a foreign key changes', () => {
      const { adapter, go } = fakeAdapter('/articles?q=react');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));
      const first = list.request();

      go('/articles?q=react&panel=edit');

      expect(list.request()).toBe(first);
    });

    it('should carry headers for a driver that pages over them', () => {
      const rangeList = defineList({
        params: { page: integerParam('page', { default: 1, min: 1 }) },
        qubee: { driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE },
        resource: 'articles',
      });
      const { adapter } = fakeAdapter('/articles?page=2');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(rangeList, { adapter }));

      expect(list.request().headers).not.toBeNull();
    });

    it("should parse a response with the list's paginator", () => {
      const { adapter } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      const page = list
        .request()
        .paginate<{ id: number }>({ data: [{ id: 1 }], meta: { current_page: 1, last_page: 4 } });

      expect(page.data).toEqual([{ id: 1 }]);
    });
  });

  describe('input', () => {
    it('should pass the input to apply', () => {
      const { adapter } = fakeAdapter('/projects/42/tasks?status=open');
      const list = TestBed.runInInjectionContext(() =>
        injectQubeeList(taskList, { adapter, input: { projectId: '42' } })
      );

      expect(list.request()?.uri).toBe(
        '/tasks?filter[project]=42&filter[status]=open&limit=15&page=1'
      );
    });

    it('should follow an input given as a signal, and be null while it is null', () => {
      const { adapter } = fakeAdapter('/tasks');
      const projectId = signal<string | null>(null);
      const list = TestBed.runInInjectionContext(() =>
        injectQubeeList(taskList, {
          adapter,
          input: () => {
            const id = projectId();

            return id ? { projectId: id } : null;
          },
        })
      );

      expect(list.request()).toBeNull();

      projectId.set('7');

      expect(list.request()?.uri).toContain('filter[project]=7');
    });

    it('should keep the same request for an equal input', () => {
      const { adapter } = fakeAdapter('/tasks');
      const input = signal({ projectId: '7' });
      const list = TestBed.runInInjectionContext(() =>
        injectQubeeList(taskList, { adapter, input })
      );
      const first = list.request();

      input.set({ projectId: '7' });

      expect(list.request()).toBe(first);
    });

    it('should always build a request for a list without an input', () => {
      const { adapter } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() =>
        injectQubeeList(articleList, { adapter, input: undefined })
      );

      expect(list.request().uri).toContain('/articles');
    });

    it('should be checked at compile time', () => {
      const { adapter } = fakeAdapter('/tasks');

      // The assertions are the @ts-expect-error lines: the spec fails to
      // compile if either call is accepted.
      TestBed.runInInjectionContext(() => {
        // @ts-expect-error — taskList declares an input
        injectQubeeList(taskList, { adapter });
        // @ts-expect-error — articleList declares none
        injectQubeeList(articleList, { adapter, input: { projectId: '7' } });
      });

      expect().nothing();
    });
  });

  describe('reset', () => {
    it('should return every param to its default in one navigation, keeping foreign keys', () => {
      const { adapter, navigations } = fakeAdapter(
        '/articles?panel=edit&q=react&status=draft&page=4'
      );
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.reset({ replace: true });

      expect(navigations).toEqual([{ href: '/articles?panel=edit', replace: true }]);
    });

    it('should not navigate when the list is at its defaults', () => {
      const { adapter, navigations } = fakeAdapter('/articles?panel=edit');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.reset();

      expect(navigations).toEqual([]);
    });
  });

  describe('toggleSort', () => {
    it('should sort ascending, then flip the primary sort', () => {
      const { adapter } = fakeAdapter();
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.toggleSort('title');

      expect(list.state().sort).toEqual([{ field: 'title', order: SortEnum.ASC }]);

      list.toggleSort('title');

      expect(list.state().sort).toEqual([{ field: 'title', order: SortEnum.DESC }]);
    });

    it('should keep the other sorts with multiple', () => {
      const { adapter } = fakeAdapter('/articles?sort=title');
      const list = TestBed.runInInjectionContext(() => injectQubeeList(articleList, { adapter }));

      list.toggleSort('publishedAt', { multiple: true });

      expect(list.href()).toBe('/articles?sort=title,publishedAt');
    });

    it('should be absent for a list without exactly one sortParam', () => {
      const { adapter } = fakeAdapter('/tasks');
      const list = TestBed.runInInjectionContext(() =>
        injectQubeeList(taskList, { adapter, input: { projectId: '1' } })
      );

      expect('toggleSort' in list).toBeFalse();
    });
  });

  it('should be destructurable', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: QUBEE_LIST_ADAPTER, useValue: fakeAdapter().adapter }],
    });

    const { set, state } = TestBed.runInInjectionContext(() => injectQubeeList(articleList));

    set({ q: 'react' });

    expect(state().q).toBe('react');
  });
});
