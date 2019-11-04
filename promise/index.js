
const PENDING = 'pending';

const FULFILLED = 'fulfilled';

const REJECTED = 'rejected';

class MyPromise {
  constructor(fn) {
    this.state = PENDING;
    this.reject = this.reject.bind(this);
    this.resolve = this.resolve.bind(this);
    try {
      fn(this.resolve, this.reject);
    } catch (error) {
      this.reject(error)
    }

    this.value = undefined;
    this.onFulfilledCallBacks = [];
    this.onRejectedCallBacks = [];
  }
  resolve(value) {
    if (value instanceof MyPromise) {
      return value.then(this.resolve, this.reject);
    }
    setTimeout(() => {
      if (this.state === PENDING) {
        this.state = FULFILLED;
        this.value = value;

        this.onFulfilledCallBacks.map((onFulfilled) => {
          onFulfilled = onFulfilled(this.value)
        })
      }
    })
  }
  reject(error) {
    setTimeout(() => {
      if (this.state === PENDING) {
        this.reason = error;
        this.state = REJECTED;
        this.onRejectedCallBacks.map((onRejected) => {
          onRejected = onRejected(this.reason)
        })
      }
    })
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value
    onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason }
    let nextPromise;
    if (this.state === PENDING) {
      nextPromise = new MyPromise((resolve, reject) => {
        this.onFulfilledCallBacks.push((value) => {
          try {
            let x = onFulfilled(value);
            resolvePromise(nextPromise, x, resolve, reject);
          } catch (error) {
            reject(error)
          }
        })
        this.onRejectedCallBacks.push((reason) => {
          try {
            let x = onRejected(reason);
            resolvePromise(nextPromise, x, resolve, reject);
          } catch (error) {
            reject(error)
          }
        })
      })
      return nextPromise
    }
    if (this.state === FULFILLED) {
      nextPromise = new MyPromise((resolve, reject) => {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(nextPromise, x, resolve, reject);
          } catch (error) {
            reject(error)
          }
        })
      })
      return nextPromise
    }
    if (this.state === REJECTED) {
      nextPromise = new MyPromise((resolve, reject) => {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(nextPromise, x, resolve, reject);
          } catch (error) {
            reject(error)
          }
        })
      })
      return nextPromise
    }
  }
  // catch(onRejected) {
  //   this.onRejected = onRejected;
  // }
}
function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) {
    reject(new TypeError('循环引用'));
  }
  if (x instanceof MyPromise) {
    if (x.state === PENDING) {
      x.then(
        y => {
          resolvePromise(promise2, y, resolve, reject);
        },
        reason => {
          reject(reason);
        }
      );
    } else {
      x.then(resolve, reject);
    }
  } else if (x && (typeof x === 'function' || typeof x === 'object')) {
    let called = false;
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    resolve(x);
  }
}


// MyPromise.all = function (promises) {
//   let resolvedNum = 0;
//   const data = new Array(promises.length);
//   return new MyPromise((resolve, reject) => {
//     for (let i = 0; i < promises.length; i += 1) {
//       const promise = promises[i];
//       promise.then(res => {
//         data[i] = res;
//         resolvedNum += 1;
//         if (resolvedNum === promises.length) {
//           resolve(data);
//         }
//       }, reject)
//     }
//   })
// }
// MyPromise.race = function (promises) {
//   return new MyPromise((resolve, reject) => {
//     for (let i = 0; i < promises.length; i += 1) {
//       const promise = promises[i];
//       promise.then(resolve, reject)
//     }
//   })
// }
// MyPromise.resolve = function (value) {
//   return new MyPromise((resolve) => resolve(value))
// }
// MyPromise.reject = function (reason) {
//   return new MyPromise((resolve, reject) => reject(reason))
// }
MyPromise.deferred = function () {
  let defer = {};
  defer.promise = new MyPromise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer;
};

module.exports = MyPromise



