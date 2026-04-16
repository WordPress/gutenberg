# Widget Types

Widget type registration and store for WordPress.

Provides a `@wordpress/data` store (`core/widget-types`) for registering
and querying widget types. Surfaces like the dashboard consume the store
to discover and render widgets.

## Usage

```js
import { dispatch, select } from '@wordpress/data';
import { store } from '@wordpress/widget-types';

// Register a widget type.
dispatch( store ).registerWidgetType( 'my-plugin/stats', {
	title: 'Stats Overview',
	render_module: 'my-plugin/widgets/stats/render',
} );

// Query registered types.
const types = select( store ).getWidgetTypes();
const stats = select( store ).getWidgetType( 'my-plugin/stats' );
```

## API

### Actions

- `registerWidgetType( name, settings )` — Register a widget type.
- `unregisterWidgetType( name )` — Remove a widget type.

### Selectors

- `getWidgetTypes()` — Returns all registered widget types.
- `getWidgetType( name )` — Returns a single widget type by name.
