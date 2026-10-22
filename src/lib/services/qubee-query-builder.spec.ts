import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FilterOperatorEnum,
  InvalidLimitError,
  InvalidPageNumberError,
  LARAVEL_DRIVER,
  NESTJS_DRIVER,
  POSTGREST_DRIVER,
  PaginationModeEnum,
  PaginationNotSyncedError,
  ParamCollisionError,
  SPATIE_DRIVER,
  SortEnum,
  UnselectableModelError,
  UnsupportedFilterError,
  UnsupportedSearchError,
  UnsupportedSortError
} from '@qubeejs/core';

import type { QubeeConfig } from '@qubeejs/core';

import { provideQubee } from '../provide-qubee';
import { QubeeQueryBuilder } from './qubee-query-builder';
import { QubeeSignalStore } from './qubee-signal-store';

const setup = (config: QubeeConfig): QubeeQueryBuilder => {
  TestBed.configureTestingModule({ providers: [provideQubee(config)] });

  return TestBed.inject(QubeeQueryBuilder);
};

describe('QubeeQueryBuilder (Spatie)', () => {
  let service: QubeeQueryBuilder;

  beforeEach(() => {
    service = setup({ driver: SPATIE_DRIVER });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateUri', () => {
    it('should return the URI synchronously', () => {
      service.setResource('users');

      expect(service.generateUri()).toBe('/users?limit=15&page=1');
    });

    it('should throw when the resource is unset', () => {
      expect(() => service.generateUri()).toThrowError(/resource/);
    });

    it('should generate a URI with filters', () => {
      service.setResource('users').addFilter('id', 1, 2, 3).addFilter('name', 'doe');

      const uri = service.generateUri();

      expect(uri).toContain('filter[id]=1,2,3');
      expect(uri).toContain('filter[name]=doe');
    });

    it('should generate a URI with sorts', () => {
      service.setResource('users').addSort('f1', SortEnum.DESC).addSort('f2', SortEnum.ASC);

      expect(service.generateUri()).toContain('sort=-f1,f2');
    });

    it('should generate a URI with fields and includes', () => {
      service.setResource('users')
        .addFields('users', ['email', 'name'])
        .addIncludes('settings')
        .addFields('settings', ['field1']);

      const uri = service.generateUri();

      expect(uri).toContain('fields[users]=email,name');
      expect(uri).toContain('fields[settings]=field1');
      expect(uri).toContain('include=settings');
    });

    it('should generate a URI with a custom limit and page', () => {
      service.setResource('users').setLimit(25).setPage(5);

      const uri = service.generateUri();

      expect(uri).toContain('limit=25');
      expect(uri).toContain('page=5');
    });

    it('should prepend the base URL', () => {
      service.setResource('users').setBaseUrl('https://api.example.com');

      expect(service.generateUri()).toMatch(/^https:\/\/api\.example\.com\/users\?/);
    });

    it('should throw UnselectableModelError when selecting fields of a model that is not included', () => {
      service.setResource('users').addFields('users', ['email']).addFields('settings', ['field1']);

      expect(() => service.generateUri()).toThrowError(UnselectableModelError);
    });

    it('should throw again after reset()', () => {
      service.setResource('users').reset();

      expect(() => service.generateUri()).toThrowError(/resource/);
    });
  });

  describe('uri', () => {
    it('should be undefined until a resource is set', () => {
      expect(service.uri()).toBeUndefined();
    });

    it('should equal generateUri() once a resource is set', () => {
      service.setResource('users').addFilter('status', 'active');

      expect(service.uri()).toBe(service.generateUri());
    });

    it('should recompute on every mutation', () => {
      service.setResource('users');

      expect(service.uri()).toBe('/users?limit=15&page=1');

      service.addFilter('status', 'active');

      expect(service.uri()).toContain('filter[status]=active');

      service.setPage(3);

      expect(service.uri()).toContain('page=3');
    });

    it('should be tracked by computed()', () => {
      const filtered = computed(() => service.uri()?.includes('filter[status]') ?? false);

      service.setResource('users');

      expect(filtered()).toBeFalse();

      service.addFilter('status', 'active');

      expect(filtered()).toBeTrue();
    });

    it('should return to undefined after reset()', () => {
      service.setResource('users');

      expect(service.uri()).toBeDefined();

      service.reset();

      expect(service.uri()).toBeUndefined();
    });

    it('should throw for a state the driver rejects, and recover once it is valid', () => {
      service.setResource('users').addFields('users', ['email']).addFields('settings', ['field1']);

      expect(() => service.uri()).toThrowError(UnselectableModelError);

      service.addIncludes('settings');

      expect(service.uri()).toContain('fields[settings]=field1');
    });
  });

  describe('setParam / deleteParams', () => {
    it('should append a param after the driver\'s own, values joined with a comma', () => {
      service.setResource('users').setParam('ids', 'a,b', 'c');

      expect(service.generateUri()).toBe('/users?limit=15&page=1&ids=a%2Cb,c');
    });

    it('should reset the page to 1', () => {
      service.setResource('users').setPage(3).setParam('status', 'failed');

      expect(service.currentPage()).toBe(1);

      service.setPage(3).deleteParams('status');

      expect(service.currentPage()).toBe(1);
    });

    it('should remove a param', () => {
      service.setResource('users').setParam('status', 'failed').deleteParams('status');

      expect(service.uri()).toBe('/users?limit=15&page=1');
    });

    it('should throw ParamCollisionError for a key the driver emits', () => {
      service.setResource('users').setParam('page', 4);

      expect(() => service.generateUri()).toThrowError(ParamCollisionError);
    });

    it('should be cleared by reset()', () => {
      service.setResource('users').setParam('status', 'failed').reset();

      expect(service.state().params).toEqual({});
    });
  });

  describe('chaining', () => {
    it('should return the service from every mutator', () => {
      service.setResource('users');

      const calls: (() => QubeeQueryBuilder)[] = [
        () => service.setBaseUrl('https://api.example.com'),
        () => service.setLimit(20),
        () => service.setPage(2),
        () => service.addFilter('status', 'active'),
        () => service.deleteFilters('status'),
        () => service.addSort('name', SortEnum.ASC),
        () => service.deleteSorts('name'),
        () => service.addFields('users', ['id']),
        () => service.deleteFields({ users: ['id'] }),
        () => service.addFields('users', ['id']),
        () => service.deleteFieldsByModel('users', 'id'),
        () => service.addIncludes('profile'),
        () => service.deleteIncludes('profile'),
        () => service.firstPage(),
        () => service.nextPage(),
        () => service.previousPage(),
        () => service.goToPage(1),
        () => service.reset()
      ];

      calls.forEach(call => expect(call()).toBe(service));
    });
  });

  describe('auto-reset of page', () => {
    it('should reset the page on a record-set mutation', () => {
      service.setResource('users').setPage(3).addFilter('status', 'active');

      expect(service.currentPage()).toBe(1);
    });

    it('should keep the page on a shape-only mutation', () => {
      service.setResource('users').setPage(3).addIncludes('profile').setBaseUrl('https://api.example.com');

      expect(service.currentPage()).toBe(3);
    });
  });
});

describe('QubeeQueryBuilder custom request keys (Spatie)', () => {
  let service: QubeeQueryBuilder;

  beforeEach(() => {
    service = setup({
      driver: SPATIE_DRIVER,
      request: {
        fields: 'fld',
        filters: 'flt',
        includes: 'inc',
        limit: 'lmt',
        page: 'p',
        sort: 'srt'
      }
    });

    service.setResource('users');
  });

  it('should honour the custom keys', () => {
    service.addFields('users', ['email', 'name'])
      .addFilter('id', 1, 2, 3)
      .addIncludes('model1', 'model2')
      .addSort('f', SortEnum.ASC)
      .setLimit(25)
      .setPage(5);

    const uri = service.generateUri();

    expect(uri).toContain('fld[users]=email,name');
    expect(uri).toContain('flt[id]=1,2,3');
    expect(uri).toContain('inc=model1,model2');
    expect(uri).toContain('srt=f');
    expect(uri).toContain('lmt=25');
    expect(uri).toContain('p=5');
  });
});

describe('QubeeQueryBuilder capability errors (Laravel)', () => {
  let service: QubeeQueryBuilder;

  beforeEach(() => {
    service = setup({ driver: LARAVEL_DRIVER });

    service.setResource('users');
  });

  it('should throw UnsupportedFilterError naming the driver', () => {
    expect(() => service.addFilter('status', 'active')).toThrowError(UnsupportedFilterError, /'laravel' driver does not support filters/);
  });

  it('should carry the driver and capability on the error', () => {
    try {
      service.addSort('name', SortEnum.ASC);
      fail('expected UnsupportedSortError');
    } catch (error) {
      expect(error).toBeInstanceOf(UnsupportedSortError);
      expect((error as UnsupportedSortError).driver).toBe('laravel');
      expect((error as UnsupportedSortError).capability).toBe('sort');
      expect((error as UnsupportedSortError).code).toBe('UNSUPPORTED_CAPABILITY');
    }
  });

  it('should throw UnsupportedSearchError when calling setSearch', () => {
    expect(() => service.setSearch('john')).toThrowError(UnsupportedSearchError);
  });

  it('should delegate limit validation to the driver', () => {
    expect(() => service.setLimit(-1)).toThrowError(InvalidLimitError);
  });

  it('should still build a pagination-only URI', () => {
    expect(service.setLimit(10).setPage(2).generateUri()).toBe('/users?limit=10&page=2');
  });
});

describe('QubeeQueryBuilder (NestJS)', () => {
  let service: QubeeQueryBuilder;

  beforeEach(() => {
    service = setup({ driver: NESTJS_DRIVER });

    service.setResource('users');
  });

  it('should accept the -1 fetch-all limit', () => {
    expect(service.setLimit(-1).generateUri()).toContain('limit=-1');
  });

  it('should generate operator filters, select and search', () => {
    const uri = service
      .addFilterOperator('age', FilterOperatorEnum.GTE, 18)
      .addSelect('id', 'name')
      .setSearch('john')
      .generateUri();

    expect(uri).toContain('filter.age=$gte:18');
    expect(uri).toContain('select=id,name');
    expect(uri).toContain('search=john');
  });

  it('should remove operator filters, select and search', () => {
    const uri = service
      .addFilterOperator('age', FilterOperatorEnum.GTE, 18)
      .addSelect('id', 'name')
      .setSearch('john')
      .deleteOperatorFilters('age')
      .deleteSelect('id', 'name')
      .deleteSearch()
      .generateUri();

    expect(uri).not.toContain('filter.age');
    expect(uri).not.toContain('select=');
    expect(uri).not.toContain('search=');
  });
});

describe('QubeeQueryBuilder paginationHeaders', () => {
  it('should be null for a URL-paginated driver', () => {
    const service = setup({ driver: SPATIE_DRIVER });

    expect(service.paginationHeaders()).toBeNull();
  });

  it('should be null for PostgREST in QUERY mode', () => {
    const service = setup({ driver: POSTGREST_DRIVER });

    service.setResource('users');

    expect(service.paginationHeaders()).toBeNull();
    expect(service.generateUri()).toContain('limit=15');
  });

  it('should yield Range headers for PostgREST in RANGE mode, and follow the page', () => {
    const service = setup({ driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE });

    service.setResource('users').setLimit(10);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    expect(service.paginationHeaders()).toEqual({ 'Range-Unit': 'items', Range: '0-9' });
    expect(service.generateUri()).not.toContain('limit=');

    service.setPage(3);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    expect(service.paginationHeaders()).toEqual({ 'Range-Unit': 'items', Range: '20-29' });
  });

  it('should keep its identity while the range is unchanged', () => {
    const service = setup({ driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE });
    const store = TestBed.inject(QubeeSignalStore);

    service.setResource('users');

    const before = service.paginationHeaders();

    store.syncLastPage(4);

    expect(service.paginationHeaders()).toBe(before);

    service.nextPage();

    expect(service.paginationHeaders()).not.toBe(before);
  });

  it('should support embedded resources', () => {
    const service = setup({ driver: POSTGREST_DRIVER });

    const uri = service.setResource('posts').addEmbedded('author', 'id', 'name').addSelect('title').generateUri();

    expect(uri).toContain('select=title,author(id,name)');

    expect(service.deleteEmbedded('author').generateUri()).not.toContain('author');
  });
});

describe('QubeeQueryBuilder pagination signals', () => {
  let service: QubeeQueryBuilder;
  let store: QubeeSignalStore;

  beforeEach(() => {
    service = setup({ driver: SPATIE_DRIVER });
    store = TestBed.inject(QubeeSignalStore);

    service.setResource('users');
  });

  describe('currentPage', () => {
    it('should follow the page', () => {
      expect(service.currentPage()).toBe(1);

      service.setPage(3);

      expect(service.currentPage()).toBe(3);
    });
  });

  describe('totalPages', () => {
    it('should be undefined until a response has synced the bounds', () => {
      expect(service.totalPages()).toBeUndefined();
    });

    it('should expose the synced last page', () => {
      store.syncLastPage(5);

      expect(service.totalPages()).toBe(5);
    });
  });

  describe('isFirstPage / hasPreviousPage', () => {
    it('should reflect page 1', () => {
      expect(service.isFirstPage()).toBeTrue();
      expect(service.hasPreviousPage()).toBeFalse();
    });

    it('should reflect a later page', () => {
      service.setPage(2);

      expect(service.isFirstPage()).toBeFalse();
      expect(service.hasPreviousPage()).toBeTrue();
    });
  });

  describe('isLastPage / hasNextPage', () => {
    it('should use conservative defaults while the bounds are unknown', () => {
      service.setPage(9);

      expect(service.isLastPage()).toBeFalse();
      expect(service.hasNextPage()).toBeTrue();
    });

    it('should reflect the synced bounds', () => {
      store.syncLastPage(3);

      service.setPage(2);

      expect(service.isLastPage()).toBeFalse();
      expect(service.hasNextPage()).toBeTrue();

      service.setPage(3);

      expect(service.isLastPage()).toBeTrue();
      expect(service.hasNextPage()).toBeFalse();
    });
  });

  describe('navigation', () => {
    it('should throw PaginationNotSyncedError from lastPage() before any sync', () => {
      expect(() => service.lastPage()).toThrowError(PaginationNotSyncedError);
    });

    it('should navigate to the last page after a sync', () => {
      store.syncLastPage(4);

      expect(service.lastPage().currentPage()).toBe(4);
    });

    it('should stop nextPage() at the known last page', () => {
      store.syncLastPage(2);

      expect(service.nextPage().currentPage()).toBe(2);
      expect(service.nextPage().currentPage()).toBe(2);
    });

    it('should floor previousPage() at page 1', () => {
      expect(service.previousPage().currentPage()).toBe(1);
    });

    it('should reject goToPage() beyond the known last page', () => {
      store.syncLastPage(2);

      expect(() => service.goToPage(3)).toThrowError(InvalidPageNumberError);
      expect(() => service.goToPage(0)).toThrowError(InvalidPageNumberError);
      expect(service.goToPage(2).currentPage()).toBe(2);
    });
  });

  it('should be tracked together in a computed()', () => {
    const label = computed(() => `${service.currentPage()} / ${service.totalPages() ?? '?'}`);

    expect(label()).toBe('1 / ?');

    store.syncLastPage(6);
    service.nextPage();

    expect(label()).toBe('2 / 6');
  });
});
