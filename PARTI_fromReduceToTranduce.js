// The reduce() method applies a function against an accumulator and each value of the array (from left-to-right) has to reduce it to a single value.
/*
Starts with an initial value
Operates on one item at a time with the reducing function using
The initial value for result in the first step
The return value of the step function for result of next iteration
Outputs a value using the last computed result.
*/

const sum = (a, b) => a + b
const mult = (a, b) => a * b

// 10 (= 1 + 2 + 3 + 4)
const sumed = [2, 3, 4].reduce(sum, 1)
// 24 (= 1 * 2 * 3 * 4)
const multed = [2, 3, 4].reduce(mult, 1)

// Transformer
// formalize the steps to reduce in a transformer
const transformer = reducingFunction =>
({
  init: 1,
  step: reducingFunction,
  result: result => result
})

var input = [2, 3, 4]
var xf = transformer(sum)
var output = input.reduce(xf.step, xf.init)

var xf = transformer(mult)
var output = input.reduce(xf.step, xf.init)

// define reduce as a function.
var reduce = (xf, init, input) => {
  const result = input.reduce(xf.step, init)
  return xf.result(result)
}

var xf = transformer(sum)
var output = reduce(xf, xf.init, input)

var xf = transformer(mult)
var output = reduce(xf, xf.init, input)


//  converts reducing function to a transformer
const wrap = xf =>
({
  init: () => { throw new Error('init not supported') },
  step: xf,
  result: result => result
})


// can still pass in transformers
// if it's function then wrap it
var reduce = (xf, init, input) => {
  if (typeof xf === 'function') {
    xf = wrap(xf)
  }
  const result = input.reduce(xf.step, init)
  return xf.result(result)
}

var output = reduce(sum, 1, input)
var output = reduce(mult, 2, input)

// ===========   fancy array copy   ========================================

// reduce with array

const append = (result, item) => {
  result.push(item)
  return result
}

var output = reduce(append, [], input)
// [ 2, 3, 4 ]

// ==========  increment every value by one  ================================

const plus1 = item => item + 1
// create a transformer
const xfplus1 = {
  init: () => { throw new Error('init not needed') },
  step: (result, item) => {
    const plus1ed = plus1(item)
    return append(result, plus1ed)
  },
  result: result => result
}

var output = reduce(xfplus1, [], input)
// [ 3, 4, 5 ]


// from append to any transformer
// accepts a transformer, xf, and uses it to return another transformer

// only the stepper transformation is aware of the type of result
// The item can be anything, as long as the stepper knows how to combine the result with the new item and return a new combined result, which it can then combine on the possible next iteration.
const transducerPlus1 = xf =>
({
  init: xf.init,
  step: (result, item) => {
    const plus1ed = plus1(item)
    return xf.step(result, plus1ed)
  },
  result: result => xf.result(result)
})

var output = reduce(transducerPlus1(wrap(append)), [], input)
// [ 3, 4, 5 ]
var output = reduce(transducerPlus1(wrap(sum)), 0, input)
// 12
//===========================================================================

// pull out plus1 and pass it in as a function f.

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

const plus2 = item => item + 2

var output = reduce(map(plus2)(wrap(append)), [], input)
// [ 4, 5, 6 ]
var output = reduce(map(plus2)(wrap(sum)), 0, input)
// 15

// ==========  encapsulate into a new function transduce  ==============================
const transduce = (transducer, stepper, init, input) => {
  if (typeof stepper === 'function') {
    // make sure we have a transformer for stepping
    stepper = wrap(stepper)
  }
  const xf = transducer(stepper)

  return reduce(xf, init, input)
}

var output = transduce(map(plus1), append, [], input)
// [ 3, 4, 5 ]
var output = transduce(map(plus2), append, [], input)
// [ 4, 5, 6 ]
var output = transduce(map(plus1), mult, 1, input)
// 60
var output = transduce(map(plus2), mult, 1, input)
// 120

// ======================================================================

const compose2 = (fn1, fn2) => item => fn1(fn2(item))
const plus3 = compose2(plus1, plus2)
var output = [plus3(2), plus3(3), plus3(4)]
// [ 5, 6, 7 ]


// the same
var output = transduce(map(compose2(plus1, plus2)), append, [], input)
var output = transduce(compose2(map(plus1), map(plus2)), append, [], input)
// [ 5, 6, 7 ]
