import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { QUBEE_LIST_ADAPTER } from '../tokens/qubee.tokens';
import { provideQubeeBrowserAdapter } from './browser-adapter';

describe('provideQubeeBrowserAdapter', () => {
  let initialUrl: string;

  beforeEach(() => {
    initialUrl = window.location.pathname + window.location.search;
    TestBed.configureTestingModule({ providers: [provideQubeeBrowserAdapter()] });
  });

  afterEach(() => {
    window.history.replaceState(null, '', initialUrl);
  });

  it('should read the address bar', () => {
    window.history.replaceState(null, '', '/articles?q=react');

    expect(TestBed.inject(QUBEE_LIST_ADAPTER).location()).toEqual({
      pathname: '/articles',
      search: '?q=react',
    });
  });

  it('should push a history entry, or replace one', () => {
    const adapter = TestBed.inject(QUBEE_LIST_ADAPTER);
    const length = window.history.length;

    adapter.navigate('/articles?page=2', { replace: false });

    expect(window.location.search).toBe('?page=2');
    expect(window.history.length).toBe(length + 1);
    expect(adapter.location().search).toBe('?page=2');

    adapter.navigate('/articles?page=3', { replace: true });

    expect(window.history.length).toBe(length + 1);
    expect(adapter.location().search).toBe('?page=3');
  });

  it('should follow popstate', () => {
    const adapter = TestBed.inject(QUBEE_LIST_ADAPTER);

    window.history.replaceState(null, '', '/articles?page=9');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(adapter.location().search).toBe('?page=9');
  });

  it('should stop listening once destroyed', () => {
    const adapter = TestBed.inject(QUBEE_LIST_ADAPTER);

    TestBed.resetTestingModule();
    window.history.replaceState(null, '', '/articles?page=9');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(adapter.location().search).not.toBe('?page=9');
  });

  it('should do nothing without a window', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideQubeeBrowserAdapter(),
        { provide: DOCUMENT, useValue: { defaultView: null } },
      ],
    });

    const adapter = TestBed.inject(QUBEE_LIST_ADAPTER);

    adapter.navigate('/articles?page=2', { replace: false });

    expect(adapter.location()).toEqual({ pathname: '', search: '' });
  });
});
