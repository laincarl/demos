interface Prop {
  source: object;
  proxy: Object;
  clone: Object | undefined;
  parent: Object | undefined;
  key: string | number | symbol | undefined;
}
declare global {
  type Dictionary<T> = { [key: string]: T };
}
interface Draft {
  [propName: string]: any;
}
interface DraftFunction {
  (draft: Draft): void;
}
function getType(something: any) {
  return Object.prototype.toString
    .call(something)
    .slice(8, -1)
    .toLowerCase();
}
function shallowCopy(something: any) {
  const type = getType(something);
  switch (type) {
    case 'object': {
      return { ...something };
    }
    case 'array': {
      return something.slice();
    }
    // case 'object': {
    //   return { ...something };
    // }
    // case 'object': {
    //   return { ...something };
    // }
    // case 'object': {
    //   return { ...something };
    // }
    // case 'object': {
    //   return { ...something };
    // }
    default: {
      return something;
    }
  }
}
function produce(state: Object, fn: DraftFunction) {
  const objects = new Map();
  function isObject(something: any) {
    return something instanceof Object;
  }
  function isProxy(something: any) {
    return objects.has(something);
  }
  // 递归克隆，在克隆出的父元素上进行修改
  function cloneParents(
    parent: Object,
    clonedChild: any,
    key: string | number | symbol
  ) {
    const attrs = objects.get(parent);
    const { clone, key: nextKey, parent: nextParent } = attrs;
    // 如果已经克隆过，直接使用克隆过的，更改值即可
    const clonedParent = clone || shallowCopy(parent);
    clonedParent[key] = clonedChild;
    // 如果是克隆过的，说明其所有父元素已经被克隆，那么不需要进行克隆
    if (clone) {
      return;
    }
    Object.assign(attrs, { clone: clonedParent });
    if (nextParent) {
      cloneParents(nextParent, clonedParent, nextKey);
    }
  }
  function lazyProxy(
    object: Object,
    parent?: Object,
    key?: PropertyKey
  ): Object {
    const proxy = new Proxy(object, {
      get: function(target: Draft, propKey: string | number, receiver) {
        const current = target[propKey];
        // 是对象才进行处理
        if (isObject(current)) {
          // 如果没有设置代理，就设置，以让其子操作时可以被监测到
          if (!isProxy(current)) {
            const proxy = lazyProxy(current, target, propKey);
            // console.log('为子设置代理', propKey)
            return proxy;
          } else {
            // console.log('第二次获取', propKey)
            // 获取时,这时判断,如果已经更改过,就返回代理对象,否则返回原对象
            const attrs = objects.get(current);
            return attrs.proxy;
            // return attrs.modify ? attrs.clone : attrs.source;
          }
        } else {
          // console.log('获取普通属性', propKey);
          return Reflect.get(target, propKey, receiver);
        }
      },
      // 这里获取到的targe是克隆过的对象
      // TODO: 数组的多次push兼容处理
      set: function(target, propKey: string | number, value, receiver) {
        if (target[propKey] !== value) {
          // console.log(target, objects.get(target))
          // console.log('set', '开始克隆', propKey);
          // 递归克隆
          cloneParents(target, value, propKey);
          return true;
        }
        // console.log('=')
        return Reflect.set(target, propKey, value, receiver);
      },
    });
    const prop: Prop = {
      source: object,
      proxy,
      clone: undefined,
      parent,
      key,
    };
    objects.set(object, prop);
    return proxy;
  }
  const proxy = lazyProxy(state);
  fn(proxy);
  const { clone, source } = objects.get(state);
  return clone || source;
}
export { produce };
