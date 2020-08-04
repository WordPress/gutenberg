# Side effects

## What are side effects?

Many `@wordpress` packages, such as UI-focused ones that register blocks or data stores, make use of side effects in their code. A side effect, in an ES module context, is code that performs some externally-visible behavior (that is, behavior which is visible outside the module) when the module is loaded.

Here is an example:

```js
import { registerStore } from '@wordpress/data';

const store = registerStore( STORE_KEY, {
  // ...
} );
```

`registerStore` is being called at the top level, which means that it will run as soon as the module first gets imported. These changes are visible externally, since things are being modified in an external store, that lives in another module. Other examples of side effects include setting globals on `window`, or adding browser behavior through polyfills.

However, if this were to happen inside of an `init` function that doesn't get called on module load, then that would no longer be a side effect:

```js
import { registerStore } from '@wordpress/data';

export function init() {
  const store = registerStore( STORE_KEY, {
		// ...
	} );
}

// `init` doesn't get called at the top level of the module,
// therefore importing the module doesn't cause side effects.
```

Declaring a variable or performing any modification at the top level that only affects the current module isn't a side effect either, since it's contained to the module:

```js
import list from './list';

// Not a side effect.
let localVariable = [];
// Not a side effect, either.
for ( const entry of list ) {
	localVariable.push( processListEntry( entry ) );
}
```

## The influence of side effects on bundling

Modern bundlers have the concept of tree-shaking, where unused code is removed from the final bundles, as it's not necessary. This becomes important in libraries that offer a lot of different functionality, since consumers of that library may only be using a small portion of it, and don't want their bundles to be larger than necessary.

These libraries should thus take steps to ensure they can indeed be correctly tree-shaken, and `@wordpress` packages are no exception.

This brings us back to side effects. As we've seen, side effects are code that runs simply by virtue of importing a module, and has an external influence of some sort. This means that the code cannot be tree-shaken away; it needs to run, because it changes things outside of the module that may be needed elsewhere.

Unfortunately, side effects are hard to determine automatically, and some bundlers err on the side of caution, assuming that every module potentially has side effects. This becomes a problem for `index` modules which re-export things from other modules, as that effectively means everything in there must now be bundled together:

```js
// index.js

export { a, b } from './module1';
export { c, d, e } from './module2';
export { f } from './module3';

// Nothing can be tree-shaken away, because the bundler doesn't know if
// this or the re-exported modules have any side effects.
```

## Telling bundlers about side effects

Since bundlers can't figure out side effects for themselves, we need to explicitly declare them. That's done in a package's `package.json`. For example, if a package has no side effects, it can simply set `sideEffects` to `false`:

```json
{
	"name": "package",
	"sideEffects": false
}
```

If it has a few files with side effects, it can list them:

```json
{
	"name": "package",
	"sideEffects": [ "dist/store/index.js", "dist/polyfill/index.js" ]
}
```

This allows the bundler to assume that only the modules that were declared have side effects, and *nothing else does*. Of course, this means that we need to be careful to include everything that *does* have side effects, or problems can arise in applications that make use of the package.

## The approach in `@wordpress`

In order to reduce maintenance cost and minimize the chance of breakage, we opted for using inverse globs for a number of `@wordpress` packages, where we list the paths that *do not* include side effects, leaving the bundler to assume that everything else does. Here's an example:

```json
{
	"sideEffects": [
		"!((src|build|build-module)/(components|utils)/**)"
	],
}
```

The above means that the bundler should assume that anything outside the `components` and `utils` directories contains side effects, and nothing in those directories does. These directories can be inside of a `src`, `build`, or `build-module` top-level directory in the package, due to the way `@wordpress` packages are built.

This approach should guarantee that everything in `components` and `utils` can be tree-shaken. It will only potentially cause problems if one of the files in there uses side effects, which would be a bad practice for a component or utility file.
