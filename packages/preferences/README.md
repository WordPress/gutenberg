# Preferences

A key/value store for application preferences.

## Installation

Install the module

```bash
npm install @wordpress/preferences --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Key concepts

### Scope

Many API calls require a 'scope' parameter that acts like a namespace. If you have multiple parameters with the same key but they apply to different parts of your application, using scopes is the best way to segregate them.

### Key

Each preference is set against a key that should be a string.

### Value

Values can be of any type, but the types supported may be limited by the persistence layer configure. For example if preferences are saved to browser localStorage in JSON format, only JSON serializable types should be used.

### Defaults

Defaults are the value returned when a preference is `undefined`. These are not persisted, they are only kept in memory. They should be during the initialization of an application.

## Examples

### Data store

Set the default preferences for any features on initialization by dispatching an action:

```js
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

function initialize() {
	// ...

	dispatch( preferencesStore ).setDefaults(
		'namespace/editor-or-plugin-name',
		{
			myBooleanFeature: true,
		}
	);

	// ...
}
```

Use the `get` selector to get a preference value, and the `set` action to update a preference:

```js
wp.data
	.select( 'core/preferences' )
	.get( 'namespace/editor-or-plugin-name', 'myPreferenceName' ); // 1
wp.data
	.dispatch( 'core/preferences' )
	.set( 'namespace/editor-or-plugin-name', 'myPreferenceName', 2 );
wp.data
	.select( 'core/preferences' )
	.get( 'namespace/editor-or-plugin-name', 'myPreferenceName' ); // 2
```

Use the `toggle` action to flip a boolean preference between `true` and `false`:

```js
wp.data
	.select( 'core/preferences' )
	.get( 'namespace/editor-or-plugin-name', 'myPreferenceName' ); // true
wp.data
	.dispatch( 'core/preferences' )
	.toggle( 'namespace/editor-or-plugin-name', 'myPreferenceName' );
wp.data
	.select( 'core/preferences' )
	.get( 'namespace/editor-or-plugin-name', 'myPreferenceName' ); // false
```

#### Setting up a persistence layer

By default, this package only stores values in-memory. But it can be configured to persist preferences to browser storage or a database via an optional persistence layer.

Use the `setPersistenceLayer` action to configure how the store persists its preference values.

```js
wp.data.dispatch( 'core/preferences' ).setPersistenceLayer( {
	// `get` is asynchronous to support persisting preferences using a REST API.
	// it will immediately be called by `setPersistenceLayer` and the returned
	// value used as the initial state of the preferences.
	async get() {
		return JSON.parse( window.localStorage.getItem( 'MY_PREFERENCES' ) );
	},

	// `set` is synchronous. It's ok to use asynchronous code, but the
	// preferences store won't wait for a promise to resolve, the function is
	// 'fire and forget'.
	set( preferences ) {
		window.localStorage.setItem(
			'MY_PREFERENCES',
			JSON.stringify( preferences )
		);
	},
} );
```

For application that persist data to an asynchronous API, a concern is that loading preferences can lead to slower application start up.

A recommendation is to pre-load any persistence layer data and keep it in a local cache particularly if you're using an asynchronous API to persist data.

Note: currently `get` is called only when `setPersistenceLayer` is triggered. This may change in the future, so it's sensible to optimize `get` using a local cache, as shown in the example below.

```js
// Preloaded data from the server.
let cache = preloadedData;
wp.data.dispatch( 'core/preferences' ).setPersistenceLayer( {
	async get() {
		if ( cache ) {
			return cache;
		}

		// Call to a made-up async API.
		return await api.preferences.get();
	},
	set( preferences ) {
		cache = preferences;
		api.preferences.set( { data: preferences } );
	},
} );
```

### Components

The `PreferenceToggleMenuItem` components can be used with a `DropdownMenu` to implement a menu for changing preferences.

```jsx
function MyEditorMenu() {
	return (
		<DropdownMenu>
			{ () => (
				<MenuGroup label={ __( 'Features' ) }>
					<PreferenceToggleMenuItem
						scope="namespace/editor-or-plugin-name"
						name="myPreferenceName"
						label={ __( 'My feature' ) }
						info={ __( 'A really awesome feature' ) }
						messageActivated={ __( 'My feature activated' ) }
						messageDeactivated={ __( 'My feature deactivated' ) }
					/>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
```

## API Reference

### Actions

The following set of dispatching action creators are available on the object returned by `wp.data.dispatch( 'core/preferences' )`:

<!-- START TOKEN(Autogenerated actions|src/store/actions.js) -->

#### set

Returns an action object used in signalling that a preference should be set to a value

_Parameters_

-   _scope_ `string`: The preference scope (e.g. core/edit-post).
-   _name_ `string`: The preference name.
-   _value_ `*`: The value to set.

_Returns_

-   `Object`: Action object.

#### setDefaults

Returns an action object used in signalling that preference defaults should be set.

_Parameters_

-   _scope_ `string`: The preference scope (e.g. core/edit-post).
-   _defaults_ `Object<string, *>`: A key/value map of preference names to values.

_Returns_

-   `Object`: Action object.

#### setPersistenceLayer

Sets the persistence layer.

When a persistence layer is set, the preferences store will:

-   call `get` immediately and update the store state to the value returned.
-   call `set` with all preferences whenever a preference changes value.

`setPersistenceLayer` should ideally be dispatched at the start of an application's lifecycle, before any other actions have been dispatched to the preferences store.

_Parameters_

-   _persistenceLayer_ `WPPreferencesPersistenceLayer`: The persistence layer.

_Returns_

-   `Object`: Action object.

#### toggle

Returns an action object used in signalling that a preference should be toggled.

_Parameters_

-   _scope_ `string`: The preference scope (e.g. core/edit-post).
-   _name_ `string`: The preference name.

<!-- END TOKEN(Autogenerated actions|src/store/actions.js) -->

### Selectors

The following selectors are available on the object returned by `wp.data.select( 'core/preferences' )`:

<!-- START TOKEN(Autogenerated selectors|src/store/selectors.js) -->

#### get

Returns a boolean indicating whether a prefer is active for a particular scope.

_Parameters_

-   _state_ `Object`: The store state.
-   _scope_ `string`: The scope of the feature (e.g. core/edit-post).
-   _name_ `string`: The name of the feature.

_Returns_

-   `*`: Is the feature enabled?

<!-- END TOKEN(Autogenerated selectors|src/store/selectors.js) -->

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
