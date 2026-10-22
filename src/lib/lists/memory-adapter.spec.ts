import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { QUBEE_LIST_ADAPTER } from '../tokens/qubee.tokens';
import { createQubeeMemoryAdapter, provideQubeeMemoryAdapter } from './memory-adapter';

describe('createQubeeMemoryAdapter', () => {
  it('should start empty', () => {
    expect(createQubeeMemoryAdapter().location()).toEqual({ pathname: '', search: '' });
  });

  it('should start from an initial query in any shape', () => {
    expect(createQubeeMemoryAdapter('?q=react').location().search).toBe('?q=react');
    expect(createQubeeMemoryAdapter({ tag: ['a', 'b'] }).location().search).toBe('?tag=a&tag=b');
  });

  it('should move to the href it is asked to navigate to', () => {
    const adapter = createQubeeMemoryAdapter();

    adapter.navigate('?page=2#top', { replace: false });

    expect(adapter.location()).toEqual({ pathname: '', search: '?page=2' });
  });

  it('should keep the same location for a navigation to where it already is', () => {
    const adapter = createQubeeMemoryAdapter('page=2');
    const before = adapter.location();

    adapter.navigate('?page=2', { replace: false });

    expect(adapter.location()).toBe(before);
  });
});

describe('provideQubeeMemoryAdapter', () => {
  @Component({ providers: [provideQubeeMemoryAdapter('q=a')], template: '' })
  class ScopeComponent {
    public readonly adapter = inject(QUBEE_LIST_ADAPTER);
  }

  it('should give each provider scope its own state', () => {
    const first = TestBed.createComponent(ScopeComponent).componentInstance.adapter;
    const second = TestBed.createComponent(ScopeComponent).componentInstance.adapter;

    first.navigate('?q=b', { replace: false });

    expect(first.location().search).toBe('?q=b');
    expect(second.location().search).toBe('?q=a');
  });
});
