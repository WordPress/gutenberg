#### v4.0.2 (2022-10-04)

- TypeScript: Fix issue preventing TypeScript types from being resolved

#### v4.0.1 (2022-06-15)

- Bug Fix: Fix error when importing in CommonJS projects.

#### v4.0.0 (2021-07-11)

- Breaking: Drop support for environments which don't have WeakMap. This should only affect Internet Explorer 10 and older.
- New: TypeScript type definitions are now included.
- Miscellaneous: The package is now implemented as a native ES module.

#### v3.0.0 (2018-02-17)

- Breaking: `getDependants` (the second argument) must return an array. Per the below added feature, this has been done in an effort to to reduce developer burden in normalizing dependants reuse as arrays.
- New: The created selector exposes `getDependants` function as a property. Refer to [README.md](https://github.com/aduth/rememo#api) for usage.

#### v2.4.1 (2018-02-17)

- Improved: Minor size and performance optimization on cache arguments handling.

#### v2.4.0 (2018-02-11)

- Improved: Now uses `WeakMap` when available and when possible to cache per set of dependants. This also results in improved cache hit rates for dependants derived from getter arguments.
- Removed: `options.maxSize` is no longer supported. The options argument, if passed, is now simply ignored.

#### v2.3.4 (2018-01-25)

- Fix: Correctly skips incorrect cached value return on mismatched argument length

#### v2.3.3 (2017-09-06)

- Fix: Resolve infinite loop which can occur due to lingering references in recalling from previous cache

#### v2.3.2 (2017-08-30)

- Fix: Resolve error which can occur in certain conditions with `maxSize`

#### v2.3.1 (2017-08-24)

- Fix: Resolve infinite loop which can occur due to lingering references in recalling from previous cache

#### v2.3.0 (2017-08-08)

- Improved: Significant performance optimizations by reimplementing cache as linked list stack. For more details and benchmarks, see [sister project "memize"](https://github.com/aduth/memize#benchmarks) from which the implementation is derived.

#### v2.2.0 (2017-08-04)

- Improved: Performance optimization on creating argument cache
- Fix: Skip impossible condition when deciding to surface result to top of cache

#### v2.1.0 (2017-07-27)

- Improved: Performance optimization on multiple subsequent selector calls with identical arguments
- Fix: Use correct cache to determine cache update optimization

#### v2.0.0 (2017-07-27)

- Breaking Change: The memoized function is no longer exposed. Calls to `selector.memoizedSelector.clear` should be updated to `selector.clear`.
- New Feature: `createSelector` accepts an optional third argument to specify options, currently supporting `maxSize` (defaulting to `Infinity`)
- Internal: Cache lookup and max size use an LRU (least recently used) policy to bias recent access, improving efficiency on subsequent calls with same arguments
- Internal: Inline memoization with returned selector to optimize arguments handling

#### v1.2.0 (2017-07-24)

- Internal: Drop moize dependency in favor of home-grown memoization solution, significantly reducing bundled size (10.2kb -> 0.5kb minified, 3.0kb -> 0.3kb minified + gzipped)
- Internal: Add package-lock.json

#### v1.1.1 (2017-06-13)

- Fix: Resolve an error in environments not supporting Promise, caused by
  defaults behavior in the underlying memoization library.

#### v1.1.0 (2017-06-08)

- Improved: Object target is ignored in generating memoized function cache key.
  This can resolve issues where cache would be discarded if dependant references
  were the same but the target object reference changed.

#### v1.0.2 (2017-05-29)

- Fix: Include dist in npm package (for unpkg availability)

#### v1.0.0 (2017-05-27)

- Initial release
