import { deepEqual } from './deep-equal';

describe('deepEqual', () => {
  it('should treat identical primitives as equal', () => {
    expect(deepEqual(1, 1)).toBeTrue();
    expect(deepEqual('a', 'a')).toBeTrue();
    expect(deepEqual(true, true)).toBeTrue();
    expect(deepEqual(null, null)).toBeTrue();
    expect(deepEqual(undefined, undefined)).toBeTrue();
    expect(deepEqual(NaN, NaN)).toBeTrue();
  });

  it('should treat different primitives as unequal', () => {
    expect(deepEqual(1, 2)).toBeFalse();
    expect(deepEqual('1', 1)).toBeFalse();
    expect(deepEqual(null, undefined)).toBeFalse();
    expect(deepEqual(0, false)).toBeFalse();
  });

  it('should distinguish null and objects', () => {
    expect(deepEqual(null, {})).toBeFalse();
    expect(deepEqual({}, null)).toBeFalse();
  });

  it('should compare arrays element by element', () => {
    expect(deepEqual([1, 'a', true], [1, 'a', true])).toBeTrue();
    expect(deepEqual([1, 2], [2, 1])).toBeFalse();
    expect(deepEqual([1, 2], [1, 2, 3])).toBeFalse();
    expect(deepEqual([], [])).toBeTrue();
  });

  it('should distinguish arrays from objects', () => {
    expect(deepEqual([], {})).toBeFalse();
     
    expect(deepEqual({ 0: 'a', length: 1 }, ['a'])).toBeFalse();
  });

  it('should compare plain objects regardless of key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBeTrue();
  });

  it('should detect missing, extra and differing keys', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBeFalse();
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBeFalse();
    expect(deepEqual({ a: 1 }, { a: 2 })).toBeFalse();
    expect(deepEqual({ a: undefined }, { b: undefined })).toBeFalse();
  });

  it('should recurse into nested structures', () => {
    const left = { filters: { status: ['active', 'pending'] }, sorts: [{ field: 'name', order: 'asc' }], page: 1 };
    const right = { filters: { status: ['active', 'pending'] }, sorts: [{ field: 'name', order: 'asc' }], page: 1 };

    expect(deepEqual(left, right)).toBeTrue();
    expect(deepEqual(left, { ...right, sorts: [{ field: 'name', order: 'desc' }] })).toBeFalse();
    expect(deepEqual(left, { ...right, filters: { status: ['active'] } })).toBeFalse();
  });

  it('should treat frozen and unfrozen copies as equal', () => {
    const value = { a: [1, { b: 2 }] };

    expect(deepEqual(Object.freeze(structuredClone(value)), value)).toBeTrue();
  });
});
