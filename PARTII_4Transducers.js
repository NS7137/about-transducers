import { transduce, append, compose, map } from "./sup.js"

/*
in PART I

All transformers contain 3 methods:

Initialize transformation with initial value,           init
Combine value with each item using reducing function,   step
Convert the last value to final output using result     result

*/

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

const plus1 = item => item + 1
const isOdd = num => num % 2 === 1
const isEq = y => x => x === y
const not = pred => x => !pred(x)

var output = transduce(filter(isOdd), append, [], [1, 2, 3, 4, 5])
// [ 1, 3, 5 ]
var output = transduce(filter(isEq(2)), append, [], [1, 2, 3, 4, 5])
// [ 2 ]
var output = transduce(filter(not(isEq(2))), append, [], [1, 2, 3, 4, 5])
// [ 1, 3, 4, 5 ]
var output = transduce(compose(map(plus1), filter(isOdd)), append, [], [1, 2, 3, 4, 5])
// [3, 5]
var output = transduce(compose(filter(isOdd), map(plus1)), append, [], [1, 2, 3, 4, 5])
// [ 2, 4, 6 ]


// 1. Although composition is right-to-left, transformation happens left-to-right
// 2. It may be more efficient to use transducers that reduce the number of items earlier in the pipeline, if possible.

// ========= remove transducer =============================
const remove = predicate => filter(not(predicate))

var output = transduce(compose(filter(isOdd), map(plus1), remove(isEq(4))), append, [], [1, 2, 3, 4, 5])
// [ 2, 6 


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

var output = transduce(drop(2), append, [], [1, 2, 3, 4, 5])


// ========= take transducer ===============================

// signal
const reduced = value => ({
  value: value,
  __transducers_reduced__: true
})

const take = n => xf => {
  let left = n
  return ({
    init: xf.init,
    step: (value, item) => {
      value = xf.step(value, item)
      if (--left <= 0) {
        // how do we stop?? 
        value = reduced(value)
      }
      return value
    },
    result: value => xf.result(value)
  })
}

var output = transduce(take(3), append, [], [1, 2, 3, 4, 5])
// [ 1, 2, 3 ]