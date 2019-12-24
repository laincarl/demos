import { produce } from '../src';

describe('blah', () => {
  it('object that not modified should be equal', () => {
    const source = {
      a: 1,
    };
    const result = produce(source, () => {});
    expect(result).toEqual(source);
  });
  it('property that not modified should be equal', () => {
    const source = {
      a: 1,
      b: {
        c: 1,
      },
      e: {
        f: 2,
      },
    };
    const result = produce(source, draft => {
      draft.b.c = 5;
      draft.b.c = 6;
    });
    expect(result.e).toEqual(source.e);
    expect(result.a).toEqual(source.a);
    expect(result.b.c).toBe(6);
    expect(source.b.c).toBe(1);
  });
  it('test array property', () => {
    const source = {
      a: 1,
      b: {
        c: [1],
      },
      e: {
        f: 2,
      },
    };
    const result = produce(source, draft => {
      draft.b.c.push(5);
      draft.b.c.push(6);
      draft.b.c.push(7);
      draft.b.c.pop();
      draft.b.c.push(8);
    });
    expect(result.e).toEqual(source.e);
    expect(result.a).toEqual(source.a);
    expect(result.b.c).toStrictEqual([1, 5, 6, 8]);
    expect(source.b.c).toStrictEqual([1]);
  });
});
