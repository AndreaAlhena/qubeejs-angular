import { inject, Injectable, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaginationModeEnum, POSTGREST_DRIVER, SPATIE_DRIVER } from '@qubeejs/core';

import { createQubeeInstance } from './create-qubee-instance';
import { provideQubee } from './provide-qubee';
import { QubeePaginator } from './services/qubee-paginator';
import { QubeeQueryBuilder } from './services/qubee-query-builder';
import { QubeeSignalStore } from './services/qubee-signal-store';

describe('createQubeeInstance', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideQubee({ driver: SPATIE_DRIVER })] });
  });

  it('should return a builder, a paginator and a store', () => {
    const instance = TestBed.runInInjectionContext(() => createQubeeInstance());

    expect(instance.builder).toBeInstanceOf(QubeeQueryBuilder);
    expect(instance.paginator).toBeInstanceOf(QubeePaginator);
    expect(instance.store).toBeInstanceOf(QubeeSignalStore);
  });

  it('should wire the three around one private store', () => {
    const { builder, paginator, store } = TestBed.runInInjectionContext(() => createQubeeInstance());

    builder.setResource('users').setPage(2);
     
    paginator.paginate({ data: [], current_page: 2, last_page: 5 });

    expect(store.state().resource).toBe('users');
    expect(builder.state()).toBe(store.state());
    expect(builder.totalPages()).toBe(5);
  });

  it('should be isolated from the environment-level instance', () => {
    const root = TestBed.inject(QubeeQueryBuilder);
    const { builder, store } = TestBed.runInInjectionContext(() => createQubeeInstance());

    root.setResource('root-resource').setLimit(50);
    builder.setResource('private-resource').setLimit(10);

    expect(root.uri()).toBe('/root-resource?limit=50&page=1');
    expect(builder.uri()).toBe('/private-resource?limit=10&page=1');
    expect(store).not.toBe(TestBed.inject(QubeeSignalStore));
  });

  it('should isolate two instances from each other', () => {
    const first = TestBed.runInInjectionContext(() => createQubeeInstance());
    const second = TestBed.runInInjectionContext(() => createQubeeInstance());

    first.builder.setResource('users').addFilter('status', 'active');
    second.builder.setResource('posts');

    expect(first.builder.uri()).toContain('/users?filter[status]=active');
    expect(second.builder.uri()).toBe('/posts?limit=15&page=1');
    expect(first.store).not.toBe(second.store);
  });

  it('should inherit the driver wiring from the parent injector', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideQubee({ driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE })]
    });

    const { builder } = TestBed.runInInjectionContext(() => createQubeeInstance());

     
    expect(builder.setResource('users').paginationHeaders()).toEqual({ 'Range-Unit': 'items', Range: '0-14' });
  });

  it('should accept an explicit injector outside an injection context', () => {
    const { builder } = createQubeeInstance(TestBed.inject(Injector));

    expect(builder.setResource('users').generateUri()).toBe('/users?limit=15&page=1');
  });

  it('should throw outside an injection context when no injector is given', () => {
    expect(() => createQubeeInstance()).toThrowError(/inject\(\)|injection context/);
  });

  it('should give a root-scoped service private state', () => {
    @Injectable({ providedIn: 'root' })
    class UserApi {
      private readonly _qubee = createQubeeInstance();

      public list(): string {
        return this._qubee.builder.setResource('users').setLimit(25).generateUri();
      }
    }

    @Injectable({ providedIn: 'root' })
    class PostApi {
      private readonly _qubee = createQubeeInstance();

      public list(): string {
        return this._qubee.builder.setResource('posts').setLimit(5).generateUri();
      }
    }

    const users = TestBed.inject(UserApi);
    const posts = TestBed.inject(PostApi);
    const root = TestBed.inject(QubeeQueryBuilder);

    expect(users.list()).toBe('/users?limit=25&page=1');
    expect(posts.list()).toBe('/posts?limit=5&page=1');
    expect(users.list()).toBe('/users?limit=25&page=1');
    expect(root.uri()).toBeUndefined();
  });

  it('should work from a constructor that injects nothing else', () => {
    @Injectable({ providedIn: 'root' })
    class Feature {
      public readonly qubee = createQubeeInstance(inject(Injector));
    }

    expect(TestBed.inject(Feature).qubee.builder).toBeInstanceOf(QubeeQueryBuilder);
  });
});
