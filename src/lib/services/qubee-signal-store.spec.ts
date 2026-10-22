import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QubeeStore, SortEnum } from '@qubeejs/core';

import { QubeeSignalStore } from './qubee-signal-store';

describe('QubeeSignalStore', () => {
  let store: QubeeSignalStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [QubeeSignalStore] });

    store = TestBed.inject(QubeeSignalStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should be a core QubeeStore', () => {
    expect(store).toBeInstanceOf(QubeeStore);
  });

  describe('state', () => {
    it('should start from the initial state', () => {
      const state = store.state();

      expect(state.resource).toBe('');
      expect(state.page).toBe(1);
      expect(state.limit).toBe(15);
      expect(state.isLastPageKnown).toBeFalse();
      expect(state.filters).toEqual({});
      expect(state.sorts).toEqual([]);
    });

    it('should mirror the core snapshot', () => {
      store.resource = 'users';

      expect(store.state()).toBe(store.getSnapshot());
    });

    it('should update after every write', () => {
      store.resource = 'users';
      store.addFilters({ status: ['active'] });
      store.page = 3;

      const state = store.state();

      expect(state.resource).toBe('users');
      expect(state.filters).toEqual({ status: ['active'] });
      expect(state.page).toBe(3);
    });

    it('should keep a stable identity between writes', () => {
      store.resource = 'users';

      expect(store.state()).toBe(store.state());
    });

    it('should change identity on a write', () => {
      const before = store.state();

      store.limit = 25;

      expect(store.state()).not.toBe(before);
    });

    it('should not notify on a write that leaves the state unchanged', () => {
      store.page = 3;

      const before = store.state();
      let notifications = 0;
      const tracker = computed(() => {
        notifications++;

        return store.state().page;
      });

      tracker();
      store.page = 3;
      store.syncLastPage(5);
      store.syncLastPage(5);
      tracker();

      expect(store.state()).not.toBe(before);
      expect(store.state().lastPage).toBe(5);
      expect(notifications).toBe(2);
    });

    it('should be tracked by computed()', () => {
      const page = computed(() => store.state().page);

      expect(page()).toBe(1);

      store.page = 4;

      expect(page()).toBe(4);
    });

    it('should hand out frozen snapshots', () => {
      store.addSort({ field: 'name', order: SortEnum.ASC });

      const state = store.state();

      expect(Object.isFrozen(state)).toBeTrue();
      expect(Object.isFrozen(state.sorts)).toBeTrue();
      expect(() => {
        (state.sorts as unknown[]).push('tampered');
      }).toThrowError(TypeError);
      expect(store.state().sorts).toHaveSize(1);
    });

    it('should return to the initial state after reset()', () => {
      store.resource = 'users';
      store.page = 3;

      store.reset();

      expect(store.state().resource).toBe('');
      expect(store.state().page).toBe(1);
    });

    it('should reflect syncLastPage()', () => {
      store.syncLastPage(7);

      expect(store.state().isLastPageKnown).toBeTrue();
      expect(store.state().lastPage).toBe(7);
    });
  });
});
