import { Component, EnvironmentProviders, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DRIVERS,
  DriverEnum,
  PaginationModeEnum,
  POSTGREST_DRIVER,
  QueryBuilderOptions,
  SPATIE_DRIVER,
  SpatieRequestStrategy,
  SpatieResponseStrategy,
  StrapiResponseOptions
} from '@qubeejs/core';

import { createQubeeInstance } from './create-qubee-instance';
import { provideQubee, provideQubeeInstance } from './provide-qubee';
import { QubeeQueryBuilder } from './services/qubee-query-builder';
import { QubeeSignalStore } from './services/qubee-signal-store';
import { QubeePaginator } from './services/qubee-paginator';
import {
  QUBEE_BASE_URL,
  QUBEE_DRIVER,
  QUBEE_REQUEST_OPTIONS,
  QUBEE_REQUEST_STRATEGY,
  QUBEE_RESPONSE_OPTIONS,
  QUBEE_RESPONSE_STRATEGY
} from './tokens/qubee.tokens';

/**
 * `makeEnvironmentProviders` wraps the array under a private field; the
 * shape is stable across Angular 17–22 but not part of the public API.
 */
type EnvironmentProvidersInternals = EnvironmentProviders & { ɵproviders: unknown[] };

describe('provideQubee', () => {
  const providersOf = (providers: EnvironmentProviders): unknown[] =>
    (providers as EnvironmentProvidersInternals).ɵproviders.flat(Infinity);

  it('should provide the store and both services', () => {
    const providers = providersOf(provideQubee({ driver: SPATIE_DRIVER }));

    expect(providers).toContain(QubeeSignalStore);
    expect(providers).toContain(QubeeQueryBuilder);
    expect(providers).toContain(QubeePaginator);
  });

  it('should provide the DI tokens for driver, strategies and options', () => {
    const provides = providersOf(provideQubee({ driver: SPATIE_DRIVER })).map(p => (p as { provide?: unknown })?.provide);

    expect(provides).toContain(QUBEE_DRIVER);
    expect(provides).toContain(QUBEE_REQUEST_STRATEGY);
    expect(provides).toContain(QUBEE_REQUEST_OPTIONS);
    expect(provides).toContain(QUBEE_RESPONSE_STRATEGY);
    expect(provides).toContain(QUBEE_RESPONSE_OPTIONS);
  });

  it('should resolve the tokens from the driver definition', () => {
    TestBed.configureTestingModule({ providers: [provideQubee({ driver: SPATIE_DRIVER })] });

    expect(TestBed.inject(QUBEE_DRIVER)).toBe(SPATIE_DRIVER);
    expect(TestBed.inject(QUBEE_REQUEST_STRATEGY)).toBeInstanceOf(SpatieRequestStrategy);
    expect(TestBed.inject(QUBEE_RESPONSE_STRATEGY)).toBeInstanceOf(SpatieResponseStrategy);
    expect(TestBed.inject(QUBEE_REQUEST_OPTIONS)).toBeInstanceOf(QueryBuilderOptions);
  });

  it('should accept a definition looked up in the registry at runtime', () => {
    TestBed.configureTestingModule({ providers: [provideQubee({ driver: DRIVERS[DriverEnum.STRAPI] })] });

    expect(TestBed.inject(QUBEE_DRIVER).id).toBe('strapi');
    expect(TestBed.inject(QUBEE_RESPONSE_OPTIONS)).toBeInstanceOf(StrapiResponseOptions);
  });

  it('should pass the pagination mode to the request strategy', () => {
    TestBed.configureTestingModule({
      providers: [provideQubee({ driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE })]
    });

    const qb = TestBed.inject(QubeeQueryBuilder);

    expect(qb.setResource('users').paginationHeaders()).not.toBeNull();
  });

  it('should pass request key overrides to the options', () => {
    TestBed.configureTestingModule({
      providers: [provideQubee({ driver: SPATIE_DRIVER, request: { filters: 'where' } })]
    });

    expect(TestBed.inject(QUBEE_REQUEST_OPTIONS).filters).toBe('where');
  });

  it('should prefix every URI with the configured base URL', () => {
    TestBed.configureTestingModule({
      providers: [provideQubee({ baseUrl: 'https://api.example.com/', driver: SPATIE_DRIVER })]
    });

    expect(TestBed.inject(QUBEE_BASE_URL)).toBe('https://api.example.com/');
    expect(TestBed.inject(QubeeQueryBuilder).setResource('users').uri())
      .toBe('https://api.example.com/users?limit=15&page=1');
  });

  it('should start every instance from the base URL, and let reset() clear it as the core does', () => {
    TestBed.configureTestingModule({
      providers: [provideQubee({ baseUrl: 'https://api.example.com', driver: SPATIE_DRIVER })]
    });

    const { builder } = TestBed.runInInjectionContext(() => createQubeeInstance());

    expect(builder.state().baseUrl).toBe('https://api.example.com');

    builder.reset();

    expect(builder.state().baseUrl).toBe('');
  });

  it('should leave the base URL empty when the config names none', () => {
    TestBed.configureTestingModule({ providers: [provideQubee({ driver: SPATIE_DRIVER })] });

    expect(TestBed.inject(QubeeQueryBuilder).setResource('users').uri()).toBe('/users?limit=15&page=1');
  });

  it('should share one store between the service and the paginator', () => {
    TestBed.configureTestingModule({ providers: [provideQubee({ driver: SPATIE_DRIVER })] });

    const qb = TestBed.inject(QubeeQueryBuilder);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    TestBed.inject(QubeePaginator).paginate({ data: [], current_page: 2, last_page: 9 });

    expect(qb.currentPage()).toBe(2);
    expect(qb.totalPages()).toBe(9);
  });
});

describe('provideQubeeInstance', () => {
  it('should expose QubeeSignalStore, QubeeQueryBuilder, and QubeePaginator', () => {
    expect(provideQubeeInstance()).toEqual([QubeeSignalStore, QubeeQueryBuilder, QubeePaginator]);
  });

  it('should yield a dedicated instance when used in a component injector', () => {
    @Component({
      selector: 'lib-dedicated',
      template: '',
      providers: [...provideQubeeInstance()]
    })
    class DedicatedComponent {
      public readonly qb = inject(QubeeQueryBuilder);
      public readonly store = inject(QubeeSignalStore);
      public readonly pagination = inject(QubeePaginator);
    }

    TestBed.configureTestingModule({
      imports: [DedicatedComponent],
      providers: [provideQubee({ driver: SPATIE_DRIVER })]
    });

    const rootQb = TestBed.inject(QubeeQueryBuilder);
    const rootStore = TestBed.inject(QubeeSignalStore);
    const rootPagination = TestBed.inject(QubeePaginator);

    const component = TestBed.createComponent(DedicatedComponent).componentInstance;

    expect(component.qb).not.toBe(rootQb);
    expect(component.store).not.toBe(rootStore);
    expect(component.pagination).not.toBe(rootPagination);
  });

  it('should isolate state between the root instance and a component-scoped one', () => {
    @Component({
      selector: 'lib-isolated',
      template: '',
      providers: [...provideQubeeInstance()]
    })
    class IsolatedComponent {
      public readonly qb = inject(QubeeQueryBuilder);
      public readonly pagination = inject(QubeePaginator);
    }

    TestBed.configureTestingModule({
      imports: [IsolatedComponent],
      providers: [provideQubee({ driver: SPATIE_DRIVER })]
    });

    const rootQb = TestBed.inject(QubeeQueryBuilder);
    rootQb.setResource('root-resource').setLimit(50);

    const component = TestBed.createComponent(IsolatedComponent).componentInstance;
    component.qb.setResource('component-resource').setLimit(10);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    component.pagination.paginate({ data: [], current_page: 1, last_page: 7 });

    expect(rootQb.uri()).toBe('/root-resource?limit=50&page=1');
    expect(component.qb.uri()).toBe('/component-resource?limit=10&page=1');
    expect(rootQb.totalPages()).toBeUndefined();
    expect(component.qb.totalPages()).toBe(7);
  });

  it('should inherit the driver wiring from the environment injector', () => {
    @Component({
      selector: 'lib-inherited',
      template: '',
      providers: [...provideQubeeInstance()]
    })
    class InheritedComponent {
      public readonly qb = inject(QubeeQueryBuilder);
    }

    TestBed.configureTestingModule({
      imports: [InheritedComponent],
      providers: [provideQubee({ driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE })]
    });

    const component = TestBed.createComponent(InheritedComponent).componentInstance;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    expect(component.qb.setResource('users').paginationHeaders()).toEqual({ 'Range-Unit': 'items', Range: '0-14' });
  });
});
