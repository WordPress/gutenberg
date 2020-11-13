# Stan

"stan" stands for "state" in Polish 🇵🇱. It's a framework agnostic library to manage distributed state in JavaScript application. It is highly inspired by the equivalent [Recoil](https://recoiljs.org/) and [jotai](https://jotai.surge.sh)

It share the same goals as Recoil and Jotai:

-   Based on atoms (or observables) which means it's highly performant at scale: Only what needs to update get updated.
-   Shares with Jotai the goal of maintaining a very light API surface.
-   Supports async and sync state.

Unlike these frameworks, it has the following goals too: (which justified the creation of a separate library)

-   It is React independent. You can create binding for any of your desired framework.
-   It needs to be flexible enough to offer bindings for `@wordpress/data` consumer API. (useSelect and useDispatch).

## Installation

Install the module

```bash
npm install @wordpress/stan --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Getting started

Stan is based on the concept of "atoms". Atoms are discrete state units and your application state is a tree of atoms that depend on each other.

### Creating basic atoms

Let's create some basic atoms:

```js
import { createAtom } from '@wordpress/stan';

// Creates an atom with an initial value of 1.
// The value can be of any type.
const counter = createAtom( 1 );
```

### Manipulating atoms

In this example we created an atom that can hold a counter that starts with `1`. 
But in order to manipulate that data, we need to create an "instance" of that atom.
We do so by adding the atom to a registry of atoms. 
The registry will then become a container of all instanciated atoms.

```js
import { createAtomRegistry } from '@wordpress/stan';

const registry = createAtomRegistry();

// this creates the "counter" atom or retrieves it if it's already in the registry.
const counterInstance = registry.getAtom( counter );

// Manipulate the atom.
console.log( counterInstance.get() ); //  prints 1.

// Modify the value of the counter
counterInstance.set( 10 );
console.log( counterInstance.get() ); //  prints 10.
```

### Subscribing to changes

Each atom is an observable to which we can subscribe:

```js
counterInstance.subscribe( () => {
    console.log( conterInstance.get() );
} );

counterInstance.set( 2 ); // prints 2.
counterInstance.set( 4 ); // prints 4.
```

### Derived atoms

Atoms can also derive their value based on other atoms. We call these "derived atoms".

```js
import { createAtom, createDerivedAtom } from '@wordpress/stan';

const counter1 = createAtom( 1 );
const counter2 = createAtom( 2 );
const sum = createDerivedAtom(
    ( get ) => get( counter1 ) + get( counter2 )
);
```

In the example above, we create two simple counter atoms and third derived "sum" atom which value is the sum of both counters. Let's see how we can interact this atom. 

So just like any other kind of atoms, we need an instance to manipulate it. Note also that adding an atom to a registry, automatically adds all its dependencies to the registry and creates instances for them if not already there.

```js
// Retrieve the sum instance and adds the counter1 and counter2 atoms to the registry as well
const sumInstance = registry.getAtom( sum );
```

One important thing to note here as well is that atoms are "lazy", which means unless someone subscribes to their changes, they won't bother computing their state. This is an important property of atoms for performance reasons. 

```js
// No one has subscribed to the sum instance yet, its value is "null"
console.log( sumInstance.get() ); // prints null.

// Adding a listener automatically triggers the resolution of the value
const unsubscribe = sumInstance.subscribe( () => {} );
console.log( sumInstance.get() ); // prints 3.
unsubscribe(); // unsubscribing stops the resolution if it's the last listener of the atom.

// Let's manipuate the value of sub atoms and see how the sum changes.
sumInstance.subscribe( () => {
    console.log( sumInstance.get() );
} );

// This edits counter1, triggering a resolution of sumInstance which triggers the console.log above.
registry.getAtom( counter1 ).set( 2 ); // now both counters equal 2 which means sum will print 4.
registry.getAtom( counter1 ).set( 4 ); // prints 6
```

### Async derived atoms

Derived atoms can use async functions to compute their values. They can for instance trigger some REST API call and returns a promise.

```js
const sum2 = createDerivedAtom(
    async ( get ) => {
        const val1 = await Promise.resolve(10);
        return val1 * get( counter );
    } 
);
```

The value of async atoms will be equal to `null` until the resolution function finishes.

### Bindings

It is important to note that stan instance and registries API are low-level APIs meant to be used by developpers to build bindings for their preferred frameworks. By in general, a higher-level API is preferred.

Currently available bindings:

-   `@wordpress/data`: WordPress data users can continue to use their existing high-level APIs useSelect/useDispatch (selectors and actions) to access the atoms. The selectors are just high-level atoms that can rely on lower-level ones and the actions are just functions that trigger atom setters. The API for `@wordpress/data` store authors to bridge the gap is still experimental.

## API Reference

<!-- START TOKEN(Autogenerated API docs) -->

<a name="createAtom" href="#createAtom">#</a> **createAtom**

Creates a basic atom.

_Parameters_

-   _initialValue_ `T`: Initial Value in the atom.
-   _id_ `[string]`: Atom id.

_Returns_

-   (unknown type): Createtd atom.

<a name="createAtomFamily" href="#createAtomFamily">#</a> **createAtomFamily**

_Parameters_

-   _resolver_ (unknown type): 
-   _updater_ (unknown type): 
-   _isAsync_ `boolean`: 
-   _id_ `[string]`: 

_Returns_

-   (unknown type): Atom Family Item creator.

<a name="createAtomRegistry" href="#createAtomRegistry">#</a> **createAtomRegistry**

Creates a new Atom Registry.

_Parameters_

-   _onAdd_ `RegistryListener`: 
-   _onDelete_ `RegistryListener`: 

_Returns_

-   (unknown type): Atom Registry.

<a name="createDerivedAtom" href="#createDerivedAtom">#</a> **createDerivedAtom**

Creates a derived atom.

_Parameters_

-   _resolver_ (unknown type): Atom Resolver.
-   _updater_ (unknown type): Atom updater.
-   _isAsync_ `[boolean]`: Atom resolution strategy.
-   _id_ `[string]`: Atom id.

_Returns_

-   (unknown type): Createtd atom.

<a name="createStoreAtom" href="#createStoreAtom">#</a> **createStoreAtom**

Creates a store atom.

_Parameters_

-   _get_ (unknown type): Get the state value.
-   _subscribe_ (unknown type): Subscribe to state changes.
-   _dispatch_ (unknown type): Dispatch store changes,
-   _id_ `[string]`: Atom id.

_Returns_

-   (unknown type): Store Atom.


<!-- END TOKEN(Autogenerated API docs) -->

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
