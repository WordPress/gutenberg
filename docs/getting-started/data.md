# Gutenberg data layer

## Pre-requisites

This doc assumes you are familiar with [Redux](https://redux.js.org/) concepts such as actions, reducers, and selectors, as well as certain Gutenberg concepts such as _[Thunks](https://gist.github.com/adamziel/2ee2a22b417825e9324f9dad26c17e73)_. You may still be able to get the gist of the ideas here without these pre-requisites, but you are highly encouraged to get familiar with them first.

## Big Ideas

Gutenberg is part of WordPress core and frequently acts on the same data. There are posts, pages, taxonomies, widgets, navigation items and so on. The obvious way of using the data, would be to just request it from API whenever a given React component needs it. This would have a serious drawback though. Any other component wanting to use the same data, would have to request it as well. So now there is more than one request. Then, what if the data changes? Would all components re-request it? Would they even know to do so?

The data layer provides answers to all of these questions and more. It handles data synchronization for you, so you can focus on your component. For example, when you need to do something with a widget, you can access it with:

```js
function MyComponent({ widgetId }) {
	const widget = useSelect(
		select => select( coreStore ).getWidget( widgetId )
	);

	// ...
}
```

Moreover, you can be sure that it’s the most recent version, and that no unnecessary HTTP requests were performed. But how does it all work? There are a few big concepts to discuss:

* Data package (`@wordpress/data`)
	* Selectors and resolvers
	* React hooks
* Core-data package (`@wordpress/core-data`)
	* Entities
	* Entity Records
	* Data flow
		* Reading Entity Records
		* Editing Entity Records
		* Saving Entity Records
		* Deleting Entity Records

# Data package
## Selectors and resolvers
Selectors are simple functions that return a piece of data from the store. Resolvers are used to load the data when there is none available yet. Let’s see how they work in tandem in this minimal store:

```js
const store = wp.data.createReduxStore( 'thermostat', {
	// Essential functions
	selectors: {
		getTemperatureCelsius: ( state ) => state.temperature,
		getTemperatureFarenheit: ( state ) => state.temperature * 1.8 + 32
	},
	resolvers: {
		getTemperatureCelsius: () => ( { dispatch } ) => {
			dispatch.receiveTemperature( 10 );
		}
	},

	// Utility functions
	__experimentalUseThunks: true,
	actions: {
		receiveTemperature: ( temperature ) => ({
			type: 'RECEIVE_TEMPERATURE',
			temperature
		})
	},
	reducer( state={}, action ) {
		const newState = {
			...state
		}
		if ( action.type === 'RECEIVE_TEMPERATURE' ) {
			newState.temperature = action.temperature;
		} else if ( action.type === '@@INIT' ) {
			newState.temperature = 0;
		}
		return newState;
	}
} );
wp.data.register(store)
```

The `@@INIT` action is dispatched when the store is instantiated, and so the initial state says `temperature: 0`.

### Simple selectors
The  `getTemperatureCelsius` is a simple selector, it predictably returns `0` once the store was instantiated:

```js
> wp.data.select('my-store').getTemperatureCelsius()
0
```

Note we didn’t provide the  `state` as an argument. The Gutenberg data layer handles that for us.

### Memoized selectors

dependency for other selectors

```js
import createSelector from 'rememo';

// This selector will only calculate the return value once,
// as long as `state.temperature` remains the same.
getTemperatureFarenheit: createSelector(
	// The selector
	( state ) => state.temperature * 1.8 + 32,

	// The reference(s) upon which the computation depends:
	( state ) => [ state.temperature ]
)
```

Read more about memoized selectors in [rememo](https://github.com/aduth/rememo) package documentation.

### Resolved selectors
`getTemperatureCelsius` is more special as there is a resolver registered under the same name. When `getTemperatureCelsius` is called for the first time, it will receive the current state and return `0`, but the data layer will also call the related resolver. Since our resolver populates the state with the temperature, the second call will return the actual data:
```js
> wp.data.select('thermostat').getTemperatureCelsius()
0
> wp.data.select('thermostat').getTemperatureCelsius()
10
```

Once the data is loaded, `getTemperatureFarenheit` can do something with it:
```js
> wp.data.select('thermostat').getTemperatureFarenheit()
50
```

As we’re about to learn, the resolvers may be asynchronous. How do you know when the data becomes available? The easiest way is to use the `resolveSelect` utility instead of `select`:
```js
> wp.data
.resolveSelect('thermostat')
.getTemperatureCelsius()
.then(( temperature ) => console.log( temperature ))
10
```
`resolveSelect` returns a promise that waits until the resolver finishes, runs the selector, then yields the final value.

### Resolvers
Let’s zoom into our resolver:
```js
getTemperatureCelsius: () => ( { dispatch } ) => {
	dispatch.receiveTemperature( 10 );
}
```

It is a [thunk](thunks%20link) that populates the state. Note  that it does not return anything, nor are there any assumptions on how the data is loaded. The sole goal of this function is to populate the state, and it does so by dispatching the `receiveTemperature` action when the data is ready.

In real world, data is often stored in APIs and needs to be loaded asynchronously. Fortunately, resolvers can be async too. Here’s a different way of loading the temperature:
```js
getTemperatureCelsius: () => async ( { dispatch } ) => {
    const response = await window.fetch( '/temperature' );
    const result = await response.json();
    dispatch.receiveCurrentTemperature( result.temperature );
}
```

An attentive reader may ask at this point _Is this going to send a request every time I use the `getTemperatureCelsius()` selector?_ Great question! The answer is no, thanks to the resolvers cache.

### Resolvers cache
Resolvers are cached by the data layer. Subsequent calls to the same selectors will not trigger additional HTTP requests.

Let’s take a closer look at the `thermostat ` store. Once it is registered with `wp.data.register(store)`, the actual state looks as follows:
```js
{
  metadata: {},
  root: {
    temperature: 0
  }
}
```
The state managed by the developer lives in `root`, and the state managed by the `@wordpress/data` package lives in `metadata`.  Let’s take a closer look at the latter.

Firstly we call the `getTemperatureCelsius` **selector** for the first time:

```js
> wp.data.select('thermostat').getTemperatureCelsius()
null
```

First, `getTemperatureCelsius` does not refer to the same function as we originally registered with the store (`( state ) => state.temperature`). Instead, the `data` package replaced it with a „resolved” version using the [mapResolvers](https://github.com/WordPress/gutenberg/blob/5dbf7ca8a285f5cab65ebf7ab87dafeb6118b6aa/packages/data/src/redux-store/index.js#L366-L442) utility. The function we’re actually calling is [`selectorResolver`](https://github.com/WordPress/gutenberg/blob/5dbf7ca8a285f5cab65ebf7ab87dafeb6118b6aa/packages/data/src/redux-store/index.js#L388) . It does two things:

1. It runs the underlying selector and returns the result.
2. It runs the underlying resolver, but only if it isn’t already running and wasn’t already fulfilled.

Note that the selector runs first, which means the resolver can’t affect its return value.

#### resolversCache

When the resolver runs for the first time, `selectorResolver` acquires a lock through `resolversCache.markAsRunning()`, and when it finishes, it releases it through `resolversCache.clear()`. That’s how we’re sure the same resolver never runs multiple times in parallel.

As a store developer, you never need to worry about the `resolversCache` API. It is internal, and resolves to resolve the unique timing challenges of the  `data` module. Outside of the data module you may lean on resolvers metadata.

#### Metadata cache

The resolver call is surrounded by two special actions: `START_RESOLUTION` and `FINISH_RESOLUTION`. If we peeked at the dispatch history after `getTemperatureCelsius()` is initially called, it would look like this:

```js
{
  type: 'START_RESOLUTION',
  selectorName: 'getTemperatureCelsius',
  args: []
}

{
  type: 'RECEIVE_TEMPERATURE',
  temperature: 10
}

{
  type: 'FINISH_RESOLUTION',
  selectorName: 'getTemperatureCelsius',
  args: []
}
```

The second, third, and any other call would not call any additional `dispatch` calls thanks to `resolversCache()`.

This is how the Redux state looks like after the `FINISH_RESOLUTION`:
```js
{
  metadata: {
    getTemperatureCelsius: /*
		A mapping with one entry:
		[] => false
	*/
  },
  root: {
    temperature: 10
  }
}
```
It means that the resolution of `getTemperatureCelsius` with an empty arguments list (`[]`) is not running at the time (`false`).

As you may notice, the resolution is cached per arguments list. If we called the selector with a bogus argument:
```
> wp.data.select('thermostat').getTemperatureCelsius(2)
10
```
It would run the resolver again and create a new metadata entry like this:
```js
{
  metadata: {
    getTemperatureCelsius: /*
		A mapping with two entries:
		[] => false
		[2] => false
	*/
  },
  root: {
    temperature: 10
  }
}
```

How is this useful? It allows you to check the resolution state of your data via metadata selectors.

#### Metadata selectors

The `data` module adds a few special selectors to every store registered with resolvers:
* `hasStartedResolution(selectorName, args)`
* `isResolving(selectorName, args)`
* `hasFinishedResolution(selectorName, args)`

The names say it all. Here’s an example:

```js
> (register a new store)
> wp.data.select('thermostat').hasStartedResolution('getTemperatureCelsius', [])
false
> wp.data.select('thermostat').isResolving('getTemperatureCelsius’)
false

> wp.data.select('thermostat').getTemperatureCelsius()
0

> wp.data.select('thermostat').hasStartedResolution('getTemperatureCelsius', [])
true
> wp.data.select('thermostat').isResolving('getTemperatureCelsius’)
false
// Not resolving yet, the resolver called asynchronously after the selector runs

> setTimeout(() => {
console.log(wp.data.select('thermostat').isResolving('getTemperatureCelsius’))
});
true

```

There are also two low-level selectors used to reason about the low-level details of the metadata mapping. They are listed for completeness, but this document does not cover them in details:
* `getCachedResolvers()`
* `getIsResolving(selectorName, args)`

#### Metadata cache invalidation

Let’s imagine the temperature reading changes every minute. We will simulate this behavior like:
```js
getTemperatureCelsius: () => ( { dispatch } ) => {
	const temperature = (new Date()).getMinutes();
    dispatch.receiveCurrentTemperature( temperature );
}
```

The selector will only trigger the resolver the first time it runs, and then it will keep returning the same data. How can you get a fresh reading? You need to invalidate the resolver cache.

The data module adds a few special actions to every store with resolvers. We’ve already discussed `startResolution` and `finishResolution`, although indirectly. Now let’s talk about `invalidateResolution( selectorName, args )`.

`invalidateResolution`  removes the specified entry from the metadata cache. Here’s how it works:

```
> wp.data.select('thermostat').getTemperatureCelsius()
0   // Initial value
> wp.data.select('thermostat').getTemperatureCelsius()
10  // Resolved reading value
// ... a few minutes pass ...
> wp.data.select('thermostat').getTemperatureCelsius()
10  // Redux state is still the same

> wp.data.dispatch('thermostat').invalidateResolution('getTemperatureCelsius', [])
Promise {<fulfilled>: {…}}  // The resolution was invalidated

> wp.data.select('thermostat').getTemperatureCelsius()
10  // Remember, selector returns the current value before resolving
    // The resolver runs again only now.
> wp.data.select('thermostat').getTemperatureCelsius()
15
```



# Core-data package
As the name `core-data` says, this package connects WordPress core and the `data`  package. To explain how it can be useful in everyday development, we need to discuss a few key concepts first.

## Entities
An entity is a basic unit of information in core-data. Entities are conceptually similar to REST API resources, database entries, and class objects. A Post is an entity, so is a Taxonomy and a Widget. We will use the latter as our running example. Default entities are declared in `entities.js`, and a minimal definition looks like this:

```js
const defaultEntities = [
	// ...
	{
		name: 'widget',
		label: __( 'Widgets' ),
		baseURL: '/wp/v2/widgets',
		kind: 'root',
	},
	// ...
}
```

`name: widget` is the Entity name, no surprises there.

`label: __( 'Widgets' )` is a human-readable name. It may be in any user interface elements that have to refer to this Entity.

`baseURL: '/wp/v2/widgets'` tells the data layer where to find an API Endpoint that can be used to interact with data of type `widget`. This URL will be requested to retrieve records, perform searches, create new ones, as well as update and delete the existing records. Later on, you will see how the data layer retrieves the data through HTTP on your behalf.

`kind: 'root'` is a namespace. It’s needed, because apart of the Entities that are statically declared in entities.js, there are also dynamically registered Entities. For example, certain custom post types may be exposed as Entities. If one of them was called `widget`, it would overwrite the actual `widget` entity. Kind exists to avoid these conflicts. `loadPostTypeEntities()` registers custom post types in a conflict-free way by providing `kind: 'postType'` .

## Entity Records
While Entity refers to a data type, Entity Record refers to the actual data. A post with ID 15 would be an Entity Record, just like a specific text widget instance. Entity Records don’t have to define any specific fields, aside of the primary key, which is `id` by default. GET requests to the `baseURL` endpoint must return a list of Entity Records. For example, requesting `/wp/v2/widgets` would return a response similar to:

```js
[
	{ id: "block", sidebar: "header", ...},
	{ id: "block-2", sidebar: "header", ...},
]
```

_But you said I don’t need to request the data, I may just select it instead._
That’s correct! The data layer happily handles all the heavy lifting for you.

## Data flow

The Redux state used by `core-data` resembles this one structure:

```js
{
	entities: {
		data: {
			root: {
				widgets: {
					queriedData: null
				}
			}
		}
	}
}
```

### Reading Entity Records

#### `getEntityRecords()`

The `core-data` store provides a named selector for each of the default entities. There is `getTaxonomies()`, `getWidgets()`, and so on. These selectors are not actually implemented from scratch: `getWidgets()` is merely a shorthand for `getEntityRecords( 'root', 'widget' )`

This is what a slightly simplified implementation of [getEntityRecords()]([https://github.com/WordPress/gutenberg/blob/d1c41d49fc040e44fa11730bee3dd7fe315b2b3f/packages/core-data/src/selectors.js#L294-L306]) looks like:
```js
export function getEntityRecords( state, kind, name, query ) {
	return getQueriedItems(
		state.entities.data[kind][type].queriedData,
		query
	);
}
```

* `kind` and `name` arguments point to the correct Entity
* `query` is an optional HTTP query that can help with things like filtering and pagination

#### Resolution
The [`getEntityRecords` resolver]([https://github.com/WordPress/gutenberg/blob/d1c41d49fc040e44fa11730bee3dd7fe315b2b3f/packages/core-data/src/resolvers.js#L167]) calls the Entity’s `baseURL` :

```js
const entity = find( entities, { kind, name } );
// ...additional checks...
const path = addQueryArgs( entity.baseURL, {
	...entity.baseURLParams,
	...query,
} );

let records = Object.values( await apiFetch( { path } ) );
// ...additional checks...
dispatch.receiveEntityRecords( kind, name, records, query );
```

In case of widgets, the `baseURL` is `/wp/v2/widgets`. Calling the selector as follows:
```js
wp.data.select('core').getEntityRecords( 'root', 'widget' )
```
Will make the resolver request [http://localhost:8888/wp/v2/widgets](#).

If we also used the `query` argument:
```js
wp.data.select('core').getEntityRecords( 'root', 'widget', { name: 'block-1' } )
```
The resolver would request [http://localhost:8888/wp/v2/widgets?name=block-1](http://localhost:8888/wp/v2/widgets).

To keep things simple, let’s omit query and focus on`getEntityRecords( 'root', 'widget' )`. Once the `apiFetch` is finished, the resolver stores the retrieved records by calling `dispatch.receiveEntityRecords()` , which dispatches the following action:
```js
{
  type: 'RECEIVE_ITEMS',
  items: [
	{ id: "block", sidebar: "header", ...},
	{ id: "block-2", sidebar: "header", ...},
  ],
  query: {},
  kind: 'root',
  name: 'widget',
  invalidateCache: false
}
```

#### Redux state
`RECEIVE_ITEMS` reducer creates the new Redux state :
```js
{
	entities: {
		data: {
			root: {
				widget: {
					queriedData: {
						items: {
							default: {
								"block": { id: "block", sidebar: "header", ...},
								"block-2": { id: "block-2", sidebar: "header", ...}
							}
						},
						itemIsComplete: {
							default: {
								"block": true,
								"block-2": true
							}
						},
						queries: {
							default: {
								"": ["block", "block-2]
							}
						}
					}
				}
			}
		}
	}
}
```

Let’s discuss each of the keys under `entities.data.root.widgets.queriedData`

#### items
```js
items: {
	default: {
		"block": { id: "block", sidebar: "header", ...},
		"block-2": { id: "block-2", sidebar: "header", ...}
	}
}
```

`items` stores the records returned by the baseURL API Endpoint. The data is keyed by items IDs for faster lookups.

The `default` wrapper denotes the `context` query parameter. For example, calling `getEntityRecords( 'root', 'widget', { context: 'edit' } )` would turn the `items` state to:

```js
items: {
	default: {
		"block": { id: "block", sidebar: "header", ...},
		"block-2": { id: "block-2", sidebar: "header", ...}
	},
	edit: {
		"block": { id: "block", sidebar: "header", ...},
		"block-2": { id: "block-2", sidebar: "header", ...}
	}
}
```

The distinction is useful, because the REST API may return different fields for different contexts.

#### itemIsComplete
```js
itemIsComplete: {
	default: {
		"block": true,
		"block-2": true
	}
}
```

Stores the information about which records finished loading already. For now, it’s only used internally in `core-data` as a dependency for the [memoized selectors](#memoized-selectors).

#### queries
```js
queries: {
	default: {
		"": ["block", "block-2]
	}
}
```

Stores the ID of items the API returned in response to each query. The widgets endpoint does not support pagination, but if it did then we could call:
```js
wp.data.select('core').getEntityRecords( 'root', 'widget', { per_page: 1 } )
```

And get a new state like
```js
queries: {
	default: {
		"": ["block", "block-2"],
		"per_page=1": ["block"]
	}
}
```

#### How it all ties together
Going back to  `getEntityRecords()` , we are now ready to move from the simplified definition to the actual one.
```js
export function getEntityRecords( state, kind, name, query ) {
	// Queried data state is prepopulated for all known entities. If this is not
	// assigned for the given parameters, then it is known to not exist.
	const queriedState = get( state.entities.data, [
		kind,
		name,
		'queriedData',
	] );
	if ( ! queriedState ) {
		return null;
	}
	return getQueriedItems( queriedState, query );
}
```

This selector uses `getQueriedItems` to find the list of relevant IDs in `queries` based on a `query`, and then picks them from `items` as a list.

As a result, the developer gets the following experience:
```js
> wp.data.select('core').getEntityRecords( 'root', 'widget' )
null  // ...resolvers running...

> wp.data.select('core').getEntityRecords( 'root', 'widget' )
[
	{ id: "block", sidebar: "header", ...},
	{ id: "block-2", sidebar: "header", ...},
]
```


#### getEntityRecord()

Just like there `core-data` provides a `getWidgets()` shortcut, it also provides `getWidget( key, query )` one. It is a shorthand for `getEntityRecord( 'root', 'widget', key, query )`:

```js
> wp.data.select('core').getEntityRecord( 'root', 'widget', 'block-2')
{id: 'block-2', ...}
```

Note that the record was returned immediately, without waiting for the resolver. This ie because `getEntityRecord( kind, type, key, query )` sources the data from the same Redux state as  `getEntityRecords()`. If the Entity Record is already stored there, it can be used immediately without re-requesting. If it’s not, we still need to wait for the resolver:

```js
> wp.data.select('core').getEntityRecord( 'root', 'widget', 'block-10')
null  // ...resolution in progress...

> wp.data.select('core').getEntityRecord( 'root', 'widget', 'block-10')
{id: 'block-10', ...}
```

The  `query` arguments works in the same way as it does for `getEntityRecords()`.

#### getRawEntityRecord()

Some Entity Record fields contain Gutenberg blocks, one such field is `post.content`. The API could simply return the raw block markup:

```js
{
	"id": 90,
	"content": '<!-- wp:site-title /-->'
}
```

But this reveals a problem: not all blocks can be rendered by JavaScript, so this information wouldn’t be enough to provide used the visual preview. Returning only the rendered block wouldn’t suffice either – the raw markup is required for editing.

To resolve this pickle, the API returns both raw and rendered block markup for some fields:

```js
{
	"id": 90,
	"content": {
		raw: '<!-- wp:site-title /-->',
		rendered: '<h1 class="wp-block-site-title"><a href="/" rel="home" >WordPress site</a></h1>'
	}
}
```

Sometimes handling an object instead of a string is not handy, so `getRawEntityRecord` collapses the `content` object into the `raw` string like this:

```js
> wp.data.select('core').getEntityRecord('postType', 'post', 90)
{
	"id": 90,
	"content": {
		raw: '<!-- wp:site-title /-->',
		rendered: '<h1 class="wp-block-site-title"><a href="/" rel="home" >WordPress site</a></h1>'
	}
}

> wp.data.select('core').getRawEntityRecord('postType', 'post', 90).content
{
	"id": 90,
	"content": '<!-- wp:site-title /-->'
}
```

How does it know which attributes to collapse? It reads the `rawAttributes` property from the Entity config:
```js
{
	label: __( 'Post Type' ),
	name: 'postType',
	kind: 'root',
	key: 'slug',
	baseURL: '/wp/v2/types',
	baseURLParams: { context: 'edit' },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
}
```



### Editing Entity Records

#### editEntityRecord()
Suppose you’re building a widgets editor. Naturally, you want to allow the user to edit the data. You have a populated form in place, but now the user changes the sidebar from `header` to `footer`. How do we keep track of these changes? We record them using the `editEntityRecord` action:

```js
wp.data.dispatch('core').editEntityRecord(
	'root',
	'widget',
	'block-2',
	{
		sidebar: 'footer'
	}
)
```

It dispatches the following action:
```js
{
	type: 'EDIT_ENTITY_RECORD',
	// Primary key of the block
	kind: 'root',
	name: 'widget',
	recordId: 'block-2',

	// The changes we just made
	edits: {
		sidebar: 'footer'
	},

	// The state to restore on undo
	meta: {
		undo: {
			kind: 'root',
			name: 'widget',
			recordId: 'block-2',
			edits: {
				sidebar: 'wp_inactive_widgets'
			}
		}
	}
}
```

And updates the Redux state as follows:
```js
{
	root: {
		entities: {
			data: {
				root: {
					widget: {
						queriedData: { /* ... */ },
						edits: {
							"block-2": {
								"sidebar": "footer"
							},
						},
					},
				},
			},
			undo: {
				offset: 0,
				0: {
					"kind": 'root"
					'name": "widget",
					"recordId": "block-2",
					"edits": {
						"sidebar": "header"
					}
				},
				1: {
					"kind": 'root"
					'name": "widget",
					"recordId": "block-2",
					"edits": {
						"sidebar": "footer"
					}
				}
			}
		}
	}
}
```

Let’s unpack what just happened! different parts of that new state:

#### data.root.widget.edits
Stores the latest edits per record. If we were to call `editEntityRecord` again, this time setting `sidebar: "primary"`, the `edits` branch would reflect the latest `primary` value.

To access the edits, use the `getEntityRecordEdits()` selector:
```js
export function getEntityRecordEdits( state, kind, name, recordId ) {
	return get( state.entities.data, [ kind, name, 'edits', recordId ] );
}
```

#### data.root.widget. queriedData and getEditedEntityRecord()
Note that the `queriedData` didn’t change. What happens if we call `getEntityRecord` now?

```js
> wp.data.select('core').getEntityRecord( 'root', 'widget',
'block-2' )
[
	{ id: "block-2", sidebar: "header", ...},
]
```

The sidebar is still `header`. This is expected, as `getEntityRecord` tells us about the most recent API data. To access the edited data, that only lives in the browser, we must use `getEditedEntityRecord()` instead:

```js
> wp.data.select('core').getEditedEntityRecord( 'root', 'widget',
'block-2' )
[
	{ id: "block-2", sidebar: "footer", ...},
]
```

`getEditedEntityRecord` has a very simple implementation. It takes the output of  `getRawEntityRecord()`, and applies any edits on top of it:
```js
( state, kind, name, recordId ) => ( {
	...getRawEntityRecord( state, kind, name, recordId ),
	...getEntityRecordEdits( state, kind, name, recordId ),
} )
```

#### The undo stack

The `undo` part of the state keeps track of all edits to the Entity Records:

```js
undo: {
	offset: 0,
	0: {
		"kind": 'root"
		'name": "widget",
		"recordId": "block-2",
		"edits": {
			"sidebar": "header"
		}
	},
	1: {
		"kind": 'root"
		'name": "widget",
		"recordId": "block-2",
		"edits": {
			"sidebar": "footer"
		}
	}
}
```

This enables you to easily add an undo and redo buttons to your app. The two core-data actions you would typically use are `undo` and `redo`.

Here’s a practical demonstration:

```js
> wp.data.select('core').getEntityRecord( 'root', 'widget', 'block-2' ).sidebar
header

> wp.data.select('core').getEditedEntityRecord( 'root', 'widget', 'block-2' ).sidebar
footer

> wp.data.dispatch('core').undo()
Promise

> wp.data.select('core').getEditedEntityRecord( 'root', 'widget', 'block-2' ).sidebar
header

> wp.data.dispatch('core').redo()
Promise

> wp.data.select('core').getEditedEntityRecord( 'root', 'widget', 'block-2' ).sidebar
footer
```

##### Undo technical details

In terms of Redux state transitions, `undo` is not a separate action but a variant of `EDIT_ENTITY_RECORD` that says `isUndo: true`:

```js
{
	type: 'EDIT_ENTITY_RECORD',
	kind: 'root',
	name: 'widget',
	recordId: 'block-2',
	edits: {
		sidebar: 'wp_inactive_widgets'
	},
	meta: {
		isUndo: true
	}
}
```

Dispatching that action does two things:
1. Updates the `offset` to `offset - 1`
2. Re-computes `data.root.widget.edits` using `undo` entries up to the `offset`

Here’s how the Redux state evolves as we do `undo` and `redo`:
```js
> const peek = () => ({
	edits: state.entities.data.root.widget.edits['block-2'],
	undoOffset: state.undo.offset,
	undoLength: state.undo.length
})
> peek()
{ edits: { sidebar: 'footer' }, undoOffset: 0, undoLength: 2 }

> wp.data.dispatch('core').undo()
{ edits: { sidebar: 'header' }, undoOffset: -1, undoLength: 2 }

> wp.data.dispatch('core').redo()
{ edits: { sidebar: 'footer' }, undoOffset: 0, undoLength: 2 }

```

Note the undo stack did not change, we merely moved the offset. Why? Because removing the _undone_ entries from Redux state would make `redo` impossible. In fact, sometimes that’s the desired behavior.

##### Overwriting undone actions

What happens to the undone actions if we call `undo()` and then edit the record again?

```js
> wp.data.dispatch('core').editEntityRecord( 'root', 'widget', 'block-2', {
	sidebar: 'footer'
} )
> wp.data.dispatch('core').undo()
> wp.data.dispatch('core').editEntityRecord( 'root', 'widget', 'block-2', {
	sidebar: 'But I insist!'
} )

```

Can we still do a redo now? Is the `sidebar: footer` diff still stored in the Redux state? The answer is no:

```js
undo: {
	offset: 0,
	0: {
		"kind": 'root"
		'name": "widget",
		"recordId": "block-2",
		"edits": {
			"sidebar": "header"
		}
	},
	1: {
		"kind": 'root"
		'name": "widget",
		"recordId": "block-2",
		"edits": {
			"sidebar": "But I insist!"
		}
	}
}
```

Editing the record deletes any _undone_ edits. It makes sense when you think about using the software. You wouldn’t want to undo a typo, fix it, and then accidentally redo that very same typo.

##### undoIgnore

As a developer, you might want to update Entity Records in a way that doesn’t interfere with the undo feature. This is what the `undoIgnore` option is for. Let’s see how it works in practice:

```js
> wp.data.dispatch('core').editEntityRecord( 'root', 'widget', 'block-2', {
	sidebar: 'footer'
} )
> wp.data.dispatch('core').undo()
> wp.data.dispatch('core').editEntityRecord(
	'root',
	'widget',
	'block-2',
	{
		sidebar: 'don't mind me'
	},
	{ undoIgnore: true }
)
```

In such a scenario, the undo stack remains untouched:

```js
undo: {
	offset: -1,
	0: {
		"kind": 'root"
		'name": "widget",
		"recordId": "block-2",
		"edits": {
			"sidebar": "header"
		}
	},
	1: {
		"kind": 'root"
		'name": "widget",
		"recordId": "block-2",
		"edits": {
			"sidebar": "footer"
		}
	}
}
```

The only change was applied to block’s edits:
```js
> state.entities.data.root.widget.edits['block-2']
{ sidebar: "don't mind me" }
```

Keep in mind, that using `undo()` and `redo()` will work just as if this update never happened.

##### transient / non-transient edits


getEntityRecordNonTransientEdits()

#### Selectors related to edited data

If you need direct access to the undo stack or any other information related to edits, the following selectors will help:

```js
wp.data.select('core').hasUndo()
wp.data.select('core').getUndoEdit()
wp.data.select('core').hasRedo()
wp.data.select('core').getRedoEdit()
wp.data.select('core').getEditedEntityRecord()
wp.data.select('core').hasEditsForEntityRecord()
wp.data.select('core').getEntityRecordNonTransientEdits()
```

The names say it all. If you would like to learn even more about their inner working, check the [core-data reference documentation](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-core-data/).

### Saving Entity Records

#### saveEditedEntityRecord()
Now that the user updated the widget, it is time to save changes. The easiest way to do it, is by using the `saveEditedEntityRecord()` action:

```js
wp.data.dispatch('core').saveEditedEntityRecord( 'root', 'widget', 'block-2' )
```

It collects all the edits for the specified Entity Record, applies them to the last queried state, and calls the API to perform the actual save operation.

```js
> wp.data.dispatch('core').editEntityRecord( 'root', 'widget', 'block-2', {
	sidebar: 'don\'t mind me'
} )
> wp.data
	.select('core')
	.hasEditsForEntityRecord( 'root', 'widget', 'block-2' )
true

> wp.data.dispatch('core').saveEditedEntityRecord( 'root', 'widget', 'block-2' )

> wp.data
	.select('core')
	.hasEditsForEntityRecord( 'root', 'widget', 'block-2' )
false
```

Under the hood, it calls `saveEntityRecord()` with all the `getEntityRecordEdits()` related to the specified record. The following two variants are equivalent:
```js
> wp.data.dispatch('core').editEntityRecord( 'root', 'widget', 'block-2', {
	sidebar: 'don\'t mind me'
} )
> wp.data
	.dispatch('core')
	.saveEditedEntityRecord( 'root', 'widget', 'block-2' )

// The above is the same as
> wp.data
	.dispatch('core')
	.saveEntityRecord( 'root', 'widget', { id: 'block-2', sidebar: 'don\'t mind me' } )
```

#### saveEntityRecord(kind, name, record, options)

`saveEntityRecord` requests the API to update the existing `record` or create a new one. How does it know what to do? It checks if an ID is present, and chooses a request path and method accordingly:

```js
const path = `${ entity.baseURL }${
	recordId ? '/' + recordId : ''
}`;`
// ...
updatedRecord = await __unstableFetch( {
	path,
	method: recordId ? 'PUT' : 'POST',
	data: edits,
} );
```

For example, saving a widget without an ID will trigger a POST request to /wp/v2/widgets:

```js
> wp.data
	.dispatch('core')
	.saveEntityRecord(
		'root',
		'widget',
		{
			sidebar: 'header',
			// Special fields required specifically by the widgets API endpoint:
			id_base: 'block',
			instance: { raw: { content: "Widget content" } } }
		}
	)
	.then(console.log)
{id: 'block-3', id_base: 'block', sidebar: 'header', ... }

```

While passing `block-3` as an ID will trigger a PUT request to `/wp/v2/widgets/block-3`:

```js
> wp.data
	.dispatch('core')
	.saveEntityRecord(
		'root',
		'widget',
		{
			id: 'block-3',
			sidebar: 'footer'
		}
	)
	.then(console.log)
{id: 'block-3', id_base: 'block', sidebar: 'footer', ... }
```

Once the record is saved and the API response with a new version is available, `saveEntityRecord` dispatches the `receiveEntityRecord` action with the new record. This way, the `queriedItems` part of the Redux state is updated, and selecting the same record again reflects the saved changes:

```js
> wp.data.select('core').getEntityRecord( 'root', 'widget', 'block-3' )
{ id: 'block-3', sidebar: 'footer' }
```

##### Lazy edits

If the `record` contains any functions, they will be evaluated. It is an optimization feature that spared expensive computations on every edit. For example, the following two records are equivalent as far as `saveEntityRecord` is concerned:

```js
{ id: 'block-2', sidebar: () => 'footer' }
{ id: 'block-2', sidebar: 'footer' }
```

##### Redux state

In Redux terms, `saveEntityRecord`dispatches the following Redux actions:

```js
{
	type: 'SAVE_ENTITY_RECORD_START',
	kind: 'root',
	name: 'widget',
	recordId: 'block-2',
	isAutosave: false
}
{
	type: 'RECEIVE_ITEMS',
	items: [
		...
	],
	persistedEdits: {
		id: 'block-2',
		sidebar: 'footer',
	},
	kind: 'root',
	name: 'widget',
	invalidateCache: true
}
{
	type: 'SAVE_ENTITY_RECORD_FINISH',
	kind: 'root',
	name: 'widget',
	recordId: 'block-2',
	isAutosave: false
}
```

After `SAVE_ENTITY_RECORD_START `, the Redux state is updated as follows:

```js
{
	entities: {
		data: {
			root: {
				widget: {
					saving: {
						block-2: {
							pending: true,
							isAutosave: false,
						}
					}
				}
			}
		}
	}
}
```

And after `SAVE_ENTITY_RECORD_FINISH`, pending is set to false.

##### Saving state

You may check if a record is currently being saved by calling `isSavingEntityRecord`:

```js
> wp.data.select('core').isSavingEntityRecord( 'root', 'widget', 'block-2' )
false
```

It returns the `pending` value from the redux state.

##### Detecting errors

If the API request fails, the final `SAVE_ENTITY_RECORD_FINISH` will have an `error` property like below:

```js
{
	type: 'SAVE_ENTITY_RECORD_FINISH',
	kind: 'root',
	name: 'widget',
	recordId: 'no-such-widget',
	error: {
		code: 'rest_widget_not_found',
		message: 'No widget was found with that id.',
		data: {
			status: 404
		}
	}
	isAutosave: false
}
```

This property is stored in the redux state alongside `pending` and `isAutosave` and may be accessed via the `getLastEntitySaveError` selector:
```js
> wp.data.select('core').getLastEntitySaveError( 'root', 'widget', 'no-such-widget' )
{code: 'rest_widget_not_found', message: 'No widget was found with that id.',  ...}
```


### Deleting Entity Records

The deletion logic is analogous to the saving logic, and there even are corresponding actions and selectors:

`saveEntityRecord()` -\> `deleteEntityRecord()`
`isSavingEntityRecord()` -\> `isDeletingEntityRecord()`
`getLastEntitySaveError()` -\> `getLastEntityDeleteError()`


