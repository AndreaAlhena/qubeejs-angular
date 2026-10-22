import { TestBed } from '@angular/core/testing';
import { SPATIE_DRIVER } from '@qubeejs/core';

import { QubeeModule } from './qubee.module';
import { QubeePaginator } from './services/qubee-paginator';
import { QubeeQueryBuilder } from './services/qubee-query-builder';
import { QUBEE_DRIVER } from './tokens/qubee.tokens';

describe('QubeeModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QubeeModule.forRoot({ driver: SPATIE_DRIVER, request: { limit: 'per_page' } })]
    });
  });

  it('should provide the driver through forRoot()', () => {
    expect(TestBed.inject(QUBEE_DRIVER)).toBe(SPATIE_DRIVER);
  });

  it('should provide a working QubeeQueryBuilder', () => {
    const qb = TestBed.inject(QubeeQueryBuilder);

    expect(qb.setResource('users').setLimit(20).generateUri()).toBe('/users?per_page=20&page=1');
  });

  it('should provide a QubeePaginator sharing the same store', () => {
    const qb = TestBed.inject(QubeeQueryBuilder);

     
    TestBed.inject(QubeePaginator).paginate({ data: [], current_page: 1, last_page: 3 });

    expect(qb.totalPages()).toBe(3);
  });
});
