/*
 * Public API Surface of @qubeejs/angular
 */

// Angular adapter: providers, services, tokens
export * from './lib/create-qubee-instance';
export * from './lib/lists/browser-adapter';
export * from './lib/lists/memory-adapter';
export * from './lib/qubee.module';
export * from './lib/provide-qubee';
export * from './lib/services/qubee-query-builder';
export * from './lib/services/qubee-signal-store';
export * from './lib/services/qubee-paginator';
export * from './lib/tokens/qubee.tokens';
export * from './lib/types/qubee-instance.type';
export * from './lib/types/qubee-list-adapter.type';

// Framework-agnostic core, re-exported in full — drivers, enums, errors,
// strategies, models, types and utilities — so everything that resolved from
// 'ng-qubee' in 3.x keeps resolving from '@qubeejs/angular' in 4.x.
export * from '@qubeejs/core';
