# @wordpress/is-shallow-equal

A function for performing a shallow comparison between two objects or arrays. Two values have shallow equality when all of their members are strictly equal to the corresponding member of the other.

## Usage

The default export of `@wordpress/is-shallow-equal` is a function which accepts two objects or arrays:

```js
import isShallowEqual from '@wordpress/is-shallow-equal';

isShallowEqual( { a: 1 }, { a: 1, b: 2 } );
// ⇒ false

isShallowEqual( { a: 1 }, { a: 1 } );
// ⇒ true

isShallowEqual( [ 1 ], [ 1, 2 ] );
// ⇒ false

isShallowEqual( [ 1 ], [ 1 ] );
// ⇒ true
```

You can import a specific implementation if you already know the types of values you are working with:

```js
import isShallowEqualArrays from '@wordpress/is-shallow-equal/arrays';
import isShallowEqualObjects from '@wordpress/is-shallow-equal/objects';
```

## Rationale

Shallow equality utilities are already a dime a dozen. Since these operations are often at the core of critical hot code paths, the WordPress contributors had specific requirements that were found to only be partially satisfied by existing solutions.

In particular, it should…

1. …consider non-primitive yet referentially-equal members values as equal.
   - Sorry, [`is-equal-shallow`](https://www.npmjs.com/package/is-equal-shallow).
2. …offer a single function through which to interface, regardless of value type.
   - Sorry, [`shallow-equal`](https://www.npmjs.com/package/shallow-equal).
3. …be barebones; only providing the basic functionality of shallow equality.
   - Sorry, [`shallow-equals`](https://www.npmjs.com/package/shallow-equals).
4. …be intended for use in non-Facebook projects.
   - Sorry, [`fbjs/lib/shallowEqual`](https://www.npmjs.com/package/fbjs).
5. …be the fastest implementation.
   - Sorry, _every other solution_.

## Benchmarks

The following results were produced under Node v9.10.1 on a MacBook Pro (Late 2016) 2.9 GHz Intel Core i7. The winner of each category is shown in bold.

>**@wordpress/is-shallow-equal (object, equal) x 4,737,184 ops/sec ±0.41% (90 runs sampled)**  
>**@wordpress/is-shallow-equal (object, same) x 529,764,894 ops/sec ±0.61% (90 runs sampled)**  
>**@wordpress/is-shallow-equal (object, unequal) x 4,925,046 ops/sec ±0.55% (92 runs sampled)**  
>**@wordpress/is-shallow-equal (array, equal) x 65,801,336 ops/sec ±0.47% (90 runs sampled)**  
>**@wordpress/is-shallow-equal (array, same) x 540,194,917 ops/sec ±0.39% (93 runs sampled)**  
>**@wordpress/is-shallow-equal (array, unequal) x 35,380,873 ops/sec ±0.91% (89 runs sampled)**  
>
>shallowequal (object, equal) x 3,290,410 ops/sec ±0.36% (93 runs sampled)  
>shallowequal (object, same) x 470,354,546 ops/sec ±0.61% (90 runs sampled)  
>shallowequal (object, unequal) x 3,552,560 ops/sec ±0.49% (92 runs sampled)  
>shallowequal (array, equal) x 1,499,613 ops/sec ±0.33% (90 runs sampled)  
>shallowequal (array, same) x 470,952,874 ops/sec ±0.36% (90 runs sampled)  
>shallowequal (array, unequal) x 1,518,756 ops/sec ±0.38% (93 runs sampled)  
>
>shallow-equal (object, equal) x 4,691,935 ops/sec ±0.66% (90 runs sampled)  
>shallow-equal (object, same) x 516,007,655 ops/sec ±0.33% (91 runs sampled)  
>shallow-equal (object, unequal) x 4,892,693 ops/sec ±0.36% (92 runs sampled)  
>shallow-equal (array, equal) x 62,132,248 ops/sec ±0.35% (90 runs sampled)  
>shallow-equal (array, same) x 516,969,309 ops/sec ±0.36% (91 runs sampled)  
>shallow-equal (array, unequal) x 34,161,863 ops/sec ±0.87% (87 runs sampled)  
>
>is-equal-shallow (object, equal) x 2,892,207 ops/sec ±0.45% (90 runs sampled)  
>is-equal-shallow (object, same) x 2,908,156 ops/sec ±0.32% (95 runs sampled)  
>is-equal-shallow (object, unequal) x 3,180,995 ops/sec ±0.36% (94 runs sampled)  
>is-equal-shallow (array, equal) x 1,105,943 ops/sec ±0.32% (91 runs sampled)  
>is-equal-shallow (array, same) x 1,104,462 ops/sec ±0.56% (93 runs sampled)  
>is-equal-shallow (array, unequal) x 1,773,097 ops/sec ±0.35% (92 runs sampled)  
>
>shallow-equals (object, equal) x 4,400,657 ops/sec ±0.36% (93 runs sampled)  
>shallow-equals (object, same) x 4,422,178 ops/sec ±0.27% (92 runs sampled)  
>shallow-equals (object, unequal) x 4,705,010 ops/sec ±0.34% (94 runs sampled)  
>shallow-equals (array, equal) x 47,976,902 ops/sec ±0.67% (87 runs sampled)  
>shallow-equals (array, same) x 66,178,859 ops/sec ±0.62% (85 runs sampled)  
>shallow-equals (array, unequal) x 27,154,150 ops/sec ±0.70% (87 runs sampled)  
>
>fbjs/lib/shallowEqual (object, equal) x 3,421,137 ops/sec ±0.36% (93 runs sampled)  
>fbjs/lib/shallowEqual (object, same) x 503,687,883 ops/sec ±0.40% (91 runs sampled)  
>fbjs/lib/shallowEqual (object, unequal) x 3,503,882 ops/sec ±0.68% (93 runs sampled)  
>fbjs/lib/shallowEqual (array, equal) x 1,510,797 ops/sec ±0.35% (90 runs sampled)  
>fbjs/lib/shallowEqual (array, same) x 245,713,360 ops/sec ±18.06% (48 runs sampled)  
>fbjs/lib/shallowEqual (array, unequal) x 1,515,645 ops/sec ±0.33% (92 runs sampled)  

You can run the benchmarks yourselves by cloning the repository, installing optional dependencies, and running the `benchmark/index.js` script:

```
git clone https://github.com/WordPress/packages.git
cd packages/packages/is-shallow-equal
npm install --optional
node benchmark
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
