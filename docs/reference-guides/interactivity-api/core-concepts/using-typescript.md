# Using TypeScript

The Interactivity API provides robust support for TypeScript, enabling developers to build type-safe stores to enhance the development experience with static type checking, improved code completion, and simplified refactoring. This guide will walk you through the process of using TypeScript with Interactivity API stores, covering everything from basic type definitions to advanced techniques for handling complex store structures.

These are the core principles of TypeScript's interaction with the Interactivity API:

-   **Inferred Types**: When you create a store using the `store` function, TypeScript automatically infers the types of the store's properties (`state`, `actions`, etc.). This means that you can often get away with just writing plain JavaScript objects, and TypeScript will figure out the types for you.

-   **Explicit Types**: When dealing with multiple store parts, local context, or the initial state defined on the server, you can explicitly define types to ensure that everything is correctly typed.

-   **Typed External Stores**: You can import typed stores from external namespaces, allowing you to use other plugins' functionality with type safety.

## Scaffolding a new typed interactive block

If you want to explore an example of an interactive block using TypeScript in your local environment, you can use the `@wordpress/create-block-interactive-typescript-template`.

To do this, follow the instructions in the [Getting Started Guide](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/iapi-quick-start-guide/) for the Interactivity API, but replace the `@wordpress/create-block-interactive-template` with the `@wordpress/create-block-interactive-typescript-template`. The rest of the instructions remain the same.

## Installing `@wordpress/interactivity` locally

If you haven't done so already, you need to install the package `@wordpress/interactivity` locally so TypeScript can use its types in your IDE. You can do this using the following command:

`npm install @wordpress/interactivity`

It is also a good practice to keep that package updated.

## Typing the store

Depending on the structure of your store and your preference, there are three options you can choose from to generate your store's types:

1.  Infer the types from your client store definition.
2.  Manually type the server state, but infer the rest from your client store definition.
3.  Manually write all the types.

### 1. Infer the types from your client store definition

When you create a store using the `store` function, TypeScript automatically infers the types of the store's properties (`state`, `actions`, `callbacks`, etc.). This means that you can often get away with just writing plain JavaScript objects, and TypeScript will figure out the types for you.

Let's start with a basic example of a counter block. We will define the store in the `view.ts` file of the block, which contains the initial global state, an action and a callback.

```ts
const myStore = store( 'myCounterPlugin', {
	state: {
		counter: 0,
	},
	actions: {
		increment() {
			myStore.state.counter += 1;
		},
	},
	callbacks: {
		log() {
			console.log( `counter: ${ myStore.state.counter }` );
		},
	},
} );
```

If you inspect the types of `myStore` using TypeScript, you will see that TypeScript has been able to infer the types correctly.

```ts
const myStore: {
	state: {
		counter: number;
	};
	actions: {
		increment(): void;
	};
	callbacks: {
		log(): void;
	};
};
```

You can also destructure the `state`, `actions` and `callbacks` properties, and the types will still work correctly.

```ts
const { state, actions } = store( 'myCounterPlugin', {
	// ...
} );
```

There is a caveat though, which is that TypeScript is not able to infer the types when they have circular references. For example, if we add a derived state using a getter that refers to the `state`, TypeScript will no longer be able to infer the types of the `state`.

For example, in this case, TypeScript cannot infer the type of `state.double` because it depends on `state.counter`, and the type of `state` is not completed until the type of `state.double` is defined, creating a circular reference.

```ts
const { state } = store( 'myCounterPlugin', {
	state: {
		counter: 0,
		get double() {
			// TypeScript can't infer this return type because it depends on `state`.
			return state.counter * 2;
		},
	},
	actions: {
		increment() {
			state.counter += 1; // This type is now unknown.
		},
	},
} );
```

In this case, depending on our TypeScript configuration, TypeScript will either warn us about a circular reference or simply add the `any` type to the `state` property.

However, solving this problem is easy; we simply need to manually provide TypeScript with the return type of that getter. Once we do that, the circular reference disappears, and TypeScript can once again infer all the `state` types.

```ts
const { state } = store( 'myCounterPlugin', {
	state: {
		counter: 0,
		get double(): number {
			return state.counter * 2;
		},
	},
	actions: {
		increment() {
			state.counter += 1; // Correctly inferred!
		},
	},
} );
```

These are the inferred types for the previous store.

```ts
const myStore: {
	state: {
		counter: number;
		readonly double: number;
	};
	actions: {
		increment(): void;
	};
};
```

Another thing to keep in mind is that, when using the Interactivity API, asynchronous actions must be defined with generators instead of async/await functions.

The reason for using generators in the Interactivity API's asynchronous actions is to be able to restore the scope from the initially triggered action once the asynchronous function continues its execution after yielding. But this is a syntax change only, otherwise, **these functions operate just like regular async/await functions**, and the inferred types from the `store` function reflect this.

Following our previous example, let's add an asynchronous action to the store.

```ts
const { state, actions } = store( 'myCounterPlugin', {
	state: {
		counter: 0,
		get double(): number {
			return state.counter * 2;
		},
	},
	actions: {
		increment() {
			state.counter += 1;
		},
		*delayedIncrement() {
			yield new Promise( ( r ) => setTimeout( r, 1000 ) );
			state.counter += 1;
		},
	},
} );
```

```ts
const myStore: {
	state: {
		counter: number;
		readonly double: number;
	};
	actions: {
		increment(): void;
		// This behaves like a regular async/await function.
		delayedIncrement(): Promise< void >;
	};
};
```

This also means that you can use your async actions in external functions, and TypeScript will correctly use the async/await types.

```ts
const someAsyncFunction = async () => {
	// This works fine and it's correctly typed.
	await actions.delayedIncrement( 2000 );
};
```

In conclusion, inferring the types is useful when you have a simple store defined in a single call to the store function and you do not need to type any global or derived state that has been initialized on the server. Just remember to:

-   Manually type the return type of your derived state.
-   Use generators for asynchronous actions.

### 2. Manually type the server state, but infer the rest from your client store definition

The global state that is initialized on the server with the `wp_interactivity_state` function doesn't exist on your client store definition and, therefore, needs to be manually typed.

Following our previous example, let's move our `counter` state initialization to the server. Remember that you also have to define the initial state of the derived state (`double` in this case) in the server.

_Please, visit [the Server-side Rendering guide](/docs/reference-guides/interactivity-api/core-concepts/server-side-rendering.md) to learn more about `wp_interactivity_state` and how directives are processed on the server._

```php
wp_interactivity_state( 'myCounterPlugin', array(
	'counter' => 1,
	'double'  => 2,
));
```

If you don't want to define all the types of your store, you can use `typeof` to infer the types of your client store definition, and merge those types with your `ServerState` type.

```ts
// Manually type the server state.
type ServerState = {
	state: {
		counter: number;
	};
};

// Define the store in a variable to be able to extract its type using `typeof` later.
const storeDef = {
	state: {
		get double(): number {
			return state.counter * 2;
		},
	},
	actions: {
		increment() {
			state.counter += 1;
		},
	},
};

// Merge the types of the server state and the store.
type Store = ServerState & typeof storeDef;

// Inject the final types when calling the `store` function.
const { state, actions } = store< Store >( 'myCounterPlugin', storeDef );
```

That's it!

Keep in mind that you don't need to manually define the types of the derived state (like `state.double`) that you initialize on the server, because they do exist in your client's store definition.

In conclusion, this approach is useful when you have a simple store defined in a single call to the store function, but you need to type the global or derived state that has been initialized on the server.

Keep in mind that you must consider these caveats:

-   You need to manually type the return of your derived state.
-   You need to use generators for asynchronous actions.

### 3. Manually write all the types

If you prefer to define all the types of the store manually instead of letting TypeScript infer them from your store definition, you can do that too. You simply need to pass them to the `store` function.

```ts
interface Store {
	state: {
		counter: number; // Initial server state
		readonly double: number;
	};
	actions: {
		increment(): void;
		delayedIncrement(): Promise< void >;
	};
}

// Pass the types when calling the `store` function.
const { state, actions } = store< Store >( 'myCounterPlugin', {
	state: {
		get double(): number {
			return state.counter * 2;
		},
	},
	actions: {
		increment() {
			state.counter += 1;
		},
		*delayedIncrement( delay = 1000 ) {
			yield new Promise( ( r ) => setTimeout( r, delay ) );
			state.counter += 1;
		},
	},
} );
```

As you can see, even though we are using generators for our asynchronous actions, when it comes to typing them, we can type them as if they were async/await functions using `Promise< ReturnType >`.

Again, as in the other approaches, keep in mind that you need to manually type the return of your derived state when its `return` depends on other parts of the `state`.

In conclusion, this approach is useful when you want to control all the types of your store and you don't mind writing them by hand.

## Typing the local context

The initial local context is defined on the server using the `data-wp-context` directive.

```html
<div data-wp-context='{ "counter": 0 }'>...</div>
```

For that reason, you need to define its type manually and pass it to the `getContext` function to ensure the returned properties are correctly typed.

```ts
// Define the types of your context.
type MyContext = {
	counter: number;
};

store( 'myCounterPlugin', {
	actions: {
		increment() {
			// Pass it to the getContext function.
			const context = getContext< MyContext >();
			// Now `context` is properly typed.
			context.counter += 1;
		},
	},
} );
```

To avoid having to pass the context types over and over, you can also define a typed function and use that function instead of `getContext`.

```ts
// Define the types of your context.
type MyContext = {
	counter: number;
};

// Define a typed function. You only have to do this once.
const getMyContext = getContext< MyContext >;

store( 'myCounterPlugin', {
	actions: {
		increment() {
			// Use your typed function.
			const context = getMyContext();
			// Now `context` is properly typed.
			context.counter += 1;
		},
	},
} );
```

That's it! Now you can access the context properties with the correct types.

## Typing stores that are divided into multiple parts

Sometimes, the stores can be divided into different files. For instance, when a part doesn't need to be loaded initially and can be placed in a module that is conditionally loaded, or when the same namespace is shared between different blocks, and each of those blocks loads the part of the store it needs.

Take, for example, these two stores enqueued by two different blocks:

```ts
// The view.ts file of the first block.
const { state } = store( 'myFavoritesPlugin', {
	state: {
		favorited: [],
		showFavorited: false,
	},
	actions: {
		showFavorited() {
			state.showFavorited; // Correctly inferred type: boolean
		},
		addToFavorited( id ) {
			state.favorited.push( id ); // Correctly inferred type: array
		},
	},
} );
```

```ts
// The view.ts file of the second block.
const { state, actions } = store( 'myFavoritesPlugin', {
	state: {
		selected: '',
	},
	actions: {
		selectFavorite() {
			const { id } = getContext();

			// Error: state.favorited doesn't exist.
			if ( ! state.favorited.includes( id ) ) {
				// Error: action.addToFavorited doesn't exist.
				actions.addToFavorited( id );
			}

			state.selected = id; // Correctly inferred type: string
		},
	},
} );
```

In this example, the action `selectFavorite` of the second block is trying to access `state.favorited` and `action.addToFavorited`, which have been defined in the store of the first block, and therefore, TypeScript does not have their types.

To solve it, you must share the inferred types of each store part with the other store part. One way to do it would be using `typeof` to export the type.

```ts
// The view.ts file of the first block.

// Define the store in a variable to be able to extract its type using `typeof`.
const storeDef = {
	state: {
		favorited: [],
		showFavorited: false,
	},
	actions: {
		showFavorited() {
			state.showFavorited;
		},
		addToFavorited( id ) {
			state.favorited.push( id );
		},
	},
};

// Pass the store part definition to the `store` function.
const { state, actions } = store( 'myFavoritesPlugin', storeDef );

// Export the type of this store part.
export type FirstBlockStore = typeof storeDef;
```

```ts
// The view.ts file of the second block.

// Import the type of the other store part from the first block.
import type { FirstBlockStore } from '../first-block/view.ts';

// Define the store in a variable to be able to extract its type using `typeof`.
const storeDef = {
	state: {
		selected: '',
	},
	actions: {
		selectFavorite() {
			const { id } = getContext();

			// Correctly typed now.
			if ( ! state.favorited.includes( id ) ) {
				// Correctly typed now.
				actions.addToFavorited( id );
			}

			state.selected = id;
		},
	},
};

// Merge the types of both store parts together.
type Store = FirstBlockStore & typeof storeDef;

// Inject the final types when calling the `store` function.
const { state, actions } = store< Store >( 'myFavoritesPlugin', storeDef );
```

That's it! If you need to use the types from the second block in the store part of the first block, you have to do the same but in the other direction.

If you don't want to infer the types and prefer to define them manually, you just need to define them in a separate file and import that definition into each of your store parts.

```ts
// types.ts
interface Store {
	state: {
		favorited: string[];
		showFavorited: boolean;
		selected: string;
	};
	actions: {
		addToFavorited( id: string ): void;
		selectFavorite(): void;
	};
}

export default Store;
```

```ts
// The view.ts file of the first block.
import type Store from '../types.ts';

const { state, actions } = store< Store >( 'myFavoritesPlugin', {
	// Everything is correctly typed here.
} );
```

```ts
// The view.ts file of the second block.
import type Store from '../types.ts';

const { state, actions } = store< Store >( 'myFavoritesPlugin', {
	// Everything is correctly typed here.
} );
```
