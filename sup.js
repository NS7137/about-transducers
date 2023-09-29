//  converts reducing function to a transformer
const wrap = xf =>
({
  init: () => { throw new Error('init not supported') },
  step: xf,
  result: result => result
})

// =====================================================

// 1. A transformer or reducing function to be wrapped as a transformer
// 2. An initial value(like[])
// 3. An input source(like an array to reduce)


// can still pass in transformers
// if it's a function then wrap it
const reduce = (xf, init, input) => {
  if (typeof xf === 'function') {
    xf = wrap(xf)
  }
  // how do we stop?? 
  // use arrayReduce replace native reduce
  // In a future article, we will remove the assumption that the input source is an array
  // const result = input.reduce(xf.step, init)
  // return xf.result(result)
  return arrayReduce(xf, init, input)
}

// arrayReduce
const arrayReduce = (xf, init, array) => {
  let value = init
  let idx = 0
  let len = array.length
  while (idx < len) {
    value = xf.step(value, array[idx])
    if (isReduced(value)) {
      value = deref(value)
      break;
    }
    idx++
  }
  return xf.result(value)
}

// To signal early termination after calling step on a transformer, 
// we can wrap our reduced value in an object with two attributes:
const reduced = value => ({
  value: value,
  __transducers_reduced__: true
})

//  add a predicate to determine if a value is reduced.
const isReduced = value => value && value.__transducers_reduced__

// a way to extract, or deref the reduced value.
const deref = reducedValue => reducedValue.value

// =====================================================

// 1. A transducer that defines the transformation
// 2. A stepper function or transformer(like append)
// 3. An initial value for the the stepper function (like [])
// 4. The input source(e.g.an array to transform)

const transduce = (transducer, stepper, init, input) => {
  if (typeof stepper === 'function') {
    // make sure we have a transformer for stepping
    stepper = wrap(stepper)
  }
  const xf = transducer(stepper)

  return reduce(xf, init, input)
}

// =========================================================

// 1. Accepts an existing transformer
// 2. Returns a new transformer which maps items by f
// 3. Delegates additional handling to the wrapped transformer

// mapping transducer
const map = f => xf =>
({
  init: xf.init,
  step: (result, item) => {
    const mapped = f(item)
    return xf.step(result, mapped)
  },
  result: result => xf.result(result)
})

//  ========= filter transducer =============================

const filter = predicate => xf => ({
  iniit: xf.init,
  step: (value, item) => {
    const allow = predicate(item)
    if (allow) {
      value = xf.step(value, item)
    }
    return value
  },
  result: value => xf.result(value)
})

// ========= remove transducer =============================

const remove = predicate => filter(not(predicate))

// ========= drop transducer ===============================

const drop = n => xf => {
  let left = n
  return ({
    init: xf.init,
    step: (value, item) => {
      if (left > 0) {
        left--
      } else {
        value = xf.step(value, item)
      }
      return value
    },
    result: value => xf.result(value)
  })
}

// ========= take transducer ===============================

const take = n => xf => {
  let left = n
  return ({
    init: xf.init,
    step: (value, item) => {
      value = xf.step(value, item)
      if (--left <= 0) {
        value = reduced(value)
      }
      return value
    },
    result: value => xf.result(value)
  })
}


// ======================================================

const append = (result, item) => {
  result.push(item)
  return result
}

const compose = (...fns) => xf => fns.reduceRight((acc, fn) => fn(acc), xf)


export { reduce, map, transduce, compose, append, filter, remove, drop, take }