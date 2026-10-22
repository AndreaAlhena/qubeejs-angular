/*
 * Public API Surface of @qubeejs/angular/http
 *
 * A separate entry point because it is built on `httpResource()`, which
 * needs Angular 19.2: applications on 17 to 19.1 never load it.
 */

export * from './qubee-http-resource';
export type * from './types/qubee-http-resource.type';
