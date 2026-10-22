import type { QubeeConfig } from '@qubeejs/core';

import { HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  NESTJS_DRIVER,
  PaginatedCollection,
  PaginationModeEnum,
  POSTGREST_DRIVER,
  SPATIE_DRIVER,
  WORDPRESS_DRIVER,
} from '@qubeejs/core';

import { provideQubee } from '../provide-qubee';
import { QubeePaginator } from './qubee-paginator';
import { QubeeQueryBuilder } from './qubee-query-builder';
import { QubeeSignalStore } from './qubee-signal-store';

type User = { id: number; name: string };

const setup = (config: QubeeConfig): QubeePaginator => {
  TestBed.configureTestingModule({ providers: [provideQubee(config)] });

  return TestBed.inject(QubeePaginator);
};

describe('QubeePaginator (Spatie)', () => {
  let service: QubeePaginator;

  beforeEach(() => {
    service = setup({ driver: SPATIE_DRIVER });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should paginate with the minimum required data', () => {
    const collection = service.paginate({ data: [], current_page: 1 });

    expect(collection).toBeInstanceOf(PaginatedCollection);
    expect(collection.data).toHaveSize(0);
    expect(collection.page).toBe(1);
  });

  it('should paginate a full Laravel-style envelope', () => {
    const collection = service.paginate<User>({
      data: [{ id: 1, name: 'Ada' }],
      current_page: 1,
      first_page_url: 'http://domain.com?page=1',
      from: 1,
      last_page: 2,
      last_page_url: 'http://domain.com?page=2',
      next_page_url: 'http://domain.com?page=2',
      path: 'http://domain.com',
      per_page: 15,
      prev_page_url: null,
      to: 15,
      total: 30,
    });

    expect(collection.data[0].name).toBe('Ada');
    expect(collection.page).toBe(1);
    expect(collection.firstPageUrl).toBe('http://domain.com?page=1');
    expect(collection.from).toBe(1);
    expect(collection.lastPage).toBe(2);
    expect(collection.lastPageUrl).toBe('http://domain.com?page=2');
    expect(collection.nextPageUrl).toBe('http://domain.com?page=2');
    expect(collection.perPage).toBe(15);
    expect(collection.prevPageUrl).toBeFalsy();
    expect(collection.to).toBe(15);
    expect(collection.total).toBe(30);
  });

  describe('auto-sync', () => {
    it('should sync page and lastPage into the shared store', () => {
      const store = TestBed.inject(QubeeSignalStore);
      const qb = TestBed.inject(QubeeQueryBuilder);

      service.paginate({ data: [], current_page: 2, last_page: 4 });

      expect(store.state().page).toBe(2);
      expect(store.state().isLastPageKnown).toBeTrue();
      expect(store.state().lastPage).toBe(4);
      expect(qb.currentPage()).toBe(2);
      expect(qb.totalPages()).toBe(4);
      expect(qb.hasNextPage()).toBeTrue();
    });

    it('should leave the bounds unknown when lastPage is absent', () => {
      const qb = TestBed.inject(QubeeQueryBuilder);

      service.paginate({ data: [], current_page: 1 });

      expect(qb.totalPages()).toBeUndefined();
    });

    it('should leave the bounds unknown when lastPage is 0', () => {
      const qb = TestBed.inject(QubeeQueryBuilder);

      service.paginate({ data: [], current_page: 1, last_page: 0 });

      expect(qb.totalPages()).toBeUndefined();
    });

    it('should let the builder navigate to the synced last page', () => {
      const qb = TestBed.inject(QubeeQueryBuilder);

      qb.setResource('users');

      service.paginate({ data: [], current_page: 1, last_page: 3 });

      expect(qb.lastPage().generateUri()).toContain('page=3');
    });
  });
});

describe('QubeePaginator (NestJS)', () => {
  let service: QubeePaginator;

  beforeEach(() => {
    service = setup({ driver: NESTJS_DRIVER });
  });

  it('should parse the nestjs-paginate envelope through the driver options', () => {
    const collection = service.paginate<User>({
      data: [{ id: 1, name: 'Ada' }],
      meta: { currentPage: 2, totalItems: 50, itemsPerPage: 10, totalPages: 5 },
      links: { first: 'http://api.com/users?page=1', next: 'http://api.com/users?page=3' },
    });

    expect(collection.page).toBe(2);
    expect(collection.total).toBe(50);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(5);
    expect(collection.nextPageUrl).toBe('http://api.com/users?page=3');
  });
});

describe('QubeePaginator (NestJS, response key overrides)', () => {
  let service: QubeePaginator;

  beforeEach(() => {
    service = setup({
      driver: NESTJS_DRIVER,
      response: { data: 'items', currentPage: 'paging.current' },
    });
  });

  it('should honour the overridden key paths', () => {
    const collection = service.paginate<User>({
      items: [{ id: 7, name: 'Grace' }],
      paging: { current: 3 },
    });

    expect(collection.data[0].id).toBe(7);
    expect(collection.page).toBe(3);
  });
});

describe('QubeePaginator (WordPress, header-driven)', () => {
  let service: QubeePaginator;

  beforeEach(() => {
    service = setup({ driver: WORDPRESS_DRIVER });
  });

  it('should read the totals from Angular HttpHeaders', () => {
    const headers = new HttpHeaders({ 'X-WP-Total': '57', 'X-WP-TotalPages': '4' });

    const collection = service.paginate<User>([{ id: 1, name: 'Ada' }], headers);

    expect(collection.data).toHaveSize(1);
    expect(collection.total).toBe(57);
    expect(collection.lastPage).toBe(4);
    expect(TestBed.inject(QubeeQueryBuilder).totalPages()).toBe(4);
  });

  it('should read the totals from a plain header record', () => {
    const collection = service.paginate([{ id: 1 }], { 'X-WP-Total': '3', 'X-WP-TotalPages': '1' });

    expect(collection.total).toBe(3);
    expect(collection.lastPage).toBe(1);
  });

  it('should leave the bounds unknown without headers', () => {
    const collection = service.paginate([{ id: 1 }]);

    expect(collection.total).toBeUndefined();
    expect(TestBed.inject(QubeeQueryBuilder).totalPages()).toBeUndefined();
  });
});

describe('QubeePaginator (PostgREST, RANGE)', () => {
  let service: QubeePaginator;

  beforeEach(() => {
    service = setup({ driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE });
  });

  it('should keep a short last page on the page that was asked for, and sync it', () => {
    const builder = TestBed.inject(QubeeQueryBuilder);
    builder.setResource('users').setLimit(10).setPage(4);

    // Four rows on the last page: the Content-Range span (4) is not the page size (10).
    const rows = [31, 32, 33, 34].map((id) => ({ id, name: `user ${id}` }));
    const collection = service.paginate<User>(rows, { 'Content-Range': '30-33/34' });

    expect(collection.page).toBe(4);
    expect(collection.perPage).toBe(10);
    expect(collection.lastPage).toBe(4);
    expect(builder.currentPage()).toBe(4);
    expect(builder.totalPages()).toBe(4);
    expect(builder.paginationHeaders()).toEqual({ Range: '30-39', 'Range-Unit': 'items' });
  });
});
