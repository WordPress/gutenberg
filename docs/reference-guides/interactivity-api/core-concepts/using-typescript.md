# Using TypeScript

The Interactivity API provides robust support for TypeScript, enabling developers to build type-safe stores to enhance the development experience with static type checking, improved code completion, and simplified refactoring. This guide will walk you through the process of using TypeScript with Interactivity API stores, covering everything from basic type definitions to advanced techniques for handling complex store structures.

These are the core principles of TypeScript's interaction with the Interactivity API:

-   **Inferred Types**: When you create a store using the `store` function, TypeScript automatically infers the types of the store's properties (`state`, `actions`, etc.). This means that you can often get away with just writing plain JavaScript objects, and TypeScript will figure out the types for you.

-   **Explicit Types**: When dealing with multiple store parts, local context, or the initial state defined on the server, you can explicitly define types to ensure that everything is correctly typed.

-   **Typed External Stores**: You can import typed stores from external namespaces, allowing you to use other plugins' functionality with type safety.

## Scaffolding a new typed interactive block

If you want to explore an example of an interactive block using TypeScript in your local environment, you can use the `@wordpress/create-block-interactive-typescript-template`.

To do this, follow the instructions in the [Getting Started Guide](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/iapi-quick-start-guide/) for the Interactivity API, but replace the `@wordpress/create-block-interactive-template` with the `@wordpress/create-block-interactive-typescript-template`. The rest of the instructions remain the same.

## Inferring types from an existing store

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

There is a caveat to this approach though, which is that TypeScript is not able to infer the types when they have circular references. For example, if we add a derived state using a getter that refers to the `state`, TypeScript will no longer be able to infer the types of the `state`.

```ts
const { state } = store( 'myCounterPlugin', {
	state: {
		counter: 0,
		get double() {
			return state.counter * 2;
		},
	},
	actions: {
		increment() {
			state.counter += 1; // TypeScript can't infer this type.
		},
	},
} );
```

In this case, depending on our TypeScript configuration, TypeScript will either warn us about a circular reference or simply add the `any` type to the `state` property.

However, solving this problem is easy; we simply need to manually provide TypeScript with the information about the return type of that getter. Once we do that, the circular reference disappears, and TypeScript can once again infer all the `state` types.

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

Using inferred types is useful when you have a simple store defined in a single call to the `store` function.

## Inferred types of async actions

In the Interactivity API, due to how the scope is transferred from some actions and derived states to others, asynchronous actions have to be defined with generators instead of async/await functions.

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

The reason for using generators in the Interactivity API's asynchronous actions is to be able to restore the scope once the asynchronous function continues its execution after yielding. Otherwise, **these functions operate just like regular async/await functions**, and the return types from the `store` function reflect this.

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

## Typing the global state initialized on the server when inferring types

Just like the local context, the global state that is initialized on the server with the `wp_interactivity_state` function needs to be manually typed.

Following our previous example, let's move our `counter` state initialization to the server. Remember that you also have to define the initial state of the derived state (`double` in this case).

```php
wp_interactivity_state( 'myCounterPlugin', array(
	'counter' => 1,
	'double'  => 2,
));
```

If you are inferring the types and you don't want to define all the types of your store, you can use `typeof` and merge it with the server state types. Keep in mind that you don't need to define the types of the derived state, because they do exist in the client's store.

```ts
// Manually type the server state.
type ServerState = {
	state: {
		counter: number;
	};
};

// Define the store in a variable to be able to extract its type using `typeof`.
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

## Explicit store typing

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
		*delayedIncrement() {
			yield new Promise( ( r ) => setTimeout( r, 1000 ) );
			state.counter += 1;
		},
	},
} );
```

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

## List of tasks

-   [ ] Create a new template for `create-block` with a typed block.
-   [ ] Make sure `@wordpress/interactivity-router` is properly typed so it can be used as an example of importing a typed store via `import`.
-   [ ] Finish the Generator -> Promise fix [PR](https://github.com/WordPress/gutenberg/pull/62400).
