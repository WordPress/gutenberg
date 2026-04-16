# Widget Types

Widget type registration and store for WordPress.

Provides a `@wordpress/data` store (`core/widget-types`) for registering
and querying widget types. Any surface — dashboard, admin page, plugin
panel — can consume the store to discover and render widgets.

This package is **surface-agnostic**: it knows nothing about where
widgets are rendered. The dashboard, for example, is a separate
consumer that reads from this store and lazy-loads render modules.

## Architecture

```
PHP (init, priority 20)                       Client
┌──────────────────────────┐    ┌──────────────────────────────────────┐
│ build/widgets/registry.php│    │ bootstrapWidgetTypes()               │
│ (auto-generated)         │    │   ├─ reads window.__registeredWidgets│
│         │                │    │   ├─ import( widget_module )         │
│         ▼                │    │   ├─ merges metadata + render_module │
│ gutenberg_register_      │    │   └─ dispatch → registerWidgetType() │
│ widget_type_dependencies │    │                    │                  │
│   ├─ collect widget deps │    │                    ▼                  │
│   ├─ re-register         │    │         ┌──────────────────┐         │
│   │   @wordpress/        │    │         │ core/widget-types│         │
│   │   widget-types with  │    │         │ store            │         │
│   │   dynamic deps       │───▶│         │                  │         │
│   └─ inject window.      │    │         └──────────────────┘         │
│      __registeredWidgets │    │                    │                  │
└──────────────────────────┘    │                    ▼                  │
                                │           Surface (dashboard, etc.)  │
                                │           useSelect → getWidgetTypes │
                                │           lazy(() => import(render)) │
                                └──────────────────────────────────────┘
```

### Three-layer separation

1. **Build** (`@wordpress/build`) — discovers `widgets/*/widget.json`,
   compiles `widget.ts` and `render.tsx`, generates `registry.php` and
   script module registrations. No runtime code.

2. **Registration** (this package + PHP loader) — populates the
   `core/widget-types` store. PHP registers script modules and injects
   the widget registry. Client-side bootstrap imports widget metadata
   modules and calls `registerWidgetType()`.

3. **Surface** (dashboard, etc.) — reads the store with
   `getWidgetTypes()`, lazy-loads render modules, and handles layout,
   persistence, and chrome (headers, actions, resize).

Each layer depends only on the one below it. Surfaces never touch
build artifacts directly; the store is the only contract.

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

### Automated bootstrap (recommended)

For widgets built with the `@wordpress/build` pipeline, registration
is automatic. The widget scaffold provides:

- `widget.json` — build discovery metadata (name)
- `widget.ts` — client-side metadata (`title`, `description`, etc.)
- `render.tsx` — lazy-loaded React component

The PHP loader and `bootstrapWidgetTypes()` handle the rest:

```js
import { bootstrapWidgetTypes } from '@wordpress/widget-types';

// Call once before rendering any surface that uses widgets.
await bootstrapWidgetTypes();
```

## API

### Store

- **Name**: `core/widget-types`
- **State shape**: `{ widgetTypes: Record< string, WidgetType > }`

### Actions

#### `registerWidgetType( name, settings )`

Register a widget type in the store. Validates the name format
(`namespace/slug`) and required fields (`title`, `render_module`).
Applies the `widgets.registerWidgetType` filter before storing.

**Parameters:**
- `name` (`string`) — Namespaced identifier (e.g., `core/on-this-day`)
- `settings` (`Partial<WidgetType>`) — Widget configuration

**Validation rules:**
- Name must be a string
- Name must match `^[a-z][a-z0-9-]*/[a-z][a-z0-9-]*$`
- `title` is required
- `render_module` is required

#### `unregisterWidgetType( name )`

Remove a widget type from the store.

**Parameters:**
- `name` (`string`) — The widget type name to remove

### Selectors

#### `getWidgetTypes()`

Returns all registered widget types as an array.

**Returns:** `WidgetType[]`

#### `getWidgetType( name )`

Returns a single widget type by name, or `undefined` if not found.

**Parameters:**
- `name` (`string`) — The widget type name

**Returns:** `WidgetType | undefined`

### Filters

#### `widgets.registerWidgetType`

Applied via `@wordpress/hooks` before a widget type is stored.
Receives the merged settings object and the widget name.

```js
import { addFilter } from '@wordpress/hooks';

addFilter(
	'widgets.registerWidgetType',
	'my-plugin/override-icon',
	( settings, name ) => {
		if ( name === 'core/on-this-day' ) {
			return { ...settings, icon: 'calendar' };
		}
		return settings;
	}
);
```

### Functions

#### `bootstrapWidgetTypes()`

Reads `window.__registeredWidgetTypes` (injected by PHP), dynamically
imports each widget's metadata module (`widget.ts`), merges it with the
`render_module` handle, and calls `registerWidgetType()` for each.

Returns a `Promise<void>` that resolves when all widgets are registered.

**Behavior:**
- Entries without `widget_module` are skipped
- Modules that fail to import are silently skipped (no throw)
- Modules must export a `default` object with widget metadata
- `render_module` falls back to empty string if absent

## WidgetType shape

```ts
interface WidgetType {
	name: string;
	title: string;
	description?: string;
	icon?: string | Record< string, unknown >;
	category?: string;
	keywords?: string[];
	render_module: string;
	attributes?: Array< {
		id: string;
		type: string;
		label: string;
		elements?: Array< { value: string; label: string } >;
	} >;
	example?: Record< string, unknown >;
	layout?: {
		contentPadding?: boolean;
		scrollableContent?: boolean;
	};
	defaults?: {
		width?: number;
		height?: number;
		order?: number;
	};
}
```

### Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Namespaced identifier (`core/on-this-day`) |
| `title` | yes | Human-readable display name |
| `description` | no | Short description for widget picker |
| `icon` | no | Dashicon slug or icon object |
| `category` | no | Grouping category for widget picker |
| `keywords` | no | Search keywords for discoverability |
| `render_module` | yes | Script module ID for lazy-loaded component |
| `attributes` | no | User-configurable fields (settings UI) |
| `example` | no | Preview data for widget picker |
| `layout` | no | Content rendering hints |
| `defaults` | no | Initial grid dimensions and sort order |

## PHP registration

The PHP loader lives at `lib/experimental/dashboard-widgets/load.php`,
gated behind the `gutenberg-dashboard-widgets` experiment.

On `init` (priority 20, after `build/widgets.php` registers script
modules at default priority):

1. Reads `build/widgets/registry.php` (auto-generated manifest)
2. Collects widget module handles as **dynamic dependencies**
3. Re-registers `@wordpress/widget-types` with the original deps +
   widget module deps (using `wp_deregister_script_module` +
   `wp_register_script_module`)
4. Injects `window.__registeredWidgetTypes` via `wp_add_inline_script`

Dynamic dependencies appear in the browser import map but are not
eagerly loaded — the client imports them on demand.

### Why re-register?

The auto-generated `build/widgets.php` registers `@wordpress/widget-types`
with its compile-time dependencies. Widget modules are discovered at
runtime from `build/widgets/registry.php`, so the PHP loader must
re-register the script module to append them. This is fragile (depends
on init priority ordering) and should eventually move into the build
template itself.

## Design decisions

### Package naming

`@wordpress/widget-types` — not `@wordpress/widgets` (already exists
for the legacy widget block editor) and not `@wordpress/dashboard-widgets`
(would couple the registry to a specific surface). Follows the pattern
of `@wordpress/blocks` being agnostic of where blocks render.

### Store: combineReducers with single reducer

The store uses `combineReducers( { widgetTypes } )` even though there
is currently only one reducer. This is intentional — it establishes
the state shape as `state.widgetTypes` so that additional reducers
(e.g., `widgetCategories`, `widgetCollections`) can be added without
breaking selectors.

The `@wordpress/blocks` store started similarly and grew to 12 combined
reducers. The widget-types store anticipates the same growth path.

### Plain action creators (not thunks)

Unlike `@wordpress/blocks` which uses thunks for `registerBlockType`,
widget-types uses plain action creators. The validation and
`applyFilters()` call happen directly in the action creator. This
is a simplification for MVP — the blocks package evolved to thunks
to support two-phase registration (bootstrapped → processed), which
widget-types doesn't need yet.

### No duplicate registration check

`registerWidgetType()` does not check whether a widget with the same
name already exists — it silently overwrites. The blocks package
checks and warns. This should be added before the experiment
graduates to stable.

### Bootstrap as public export

`bootstrapWidgetTypes()` is exported publicly, unlike the blocks
package which uses `unstable__bootstrapServerSideBlockDefinitions`
(marked unstable). Since widget-types is experimental (behind an
experiment flag), the entire public API is implicitly unstable.
When the experiment graduates, this function should be prefixed
or moved to a private export.

## Known concerns

### `sideEffects` missing in package.json

The store is registered via `register( store )` as a top-level side
effect in `store/index.ts`. Without a `sideEffects` declaration in
`package.json`, aggressive bundlers may tree-shake this call. In
practice, Gutenberg's build system (`@wordpress/build`) and the
WordPress script module loader mitigate this, but the declaration
should be added for correctness:

```json
"sideEffects": [
	"src/index.{js,ts}",
	"src/store/index.{js,ts}",
	"build/index.cjs",
	"build/store/index.cjs",
	"build-module/index.mjs",
	"build-module/store/index.mjs"
]
```

### Re-register pattern is fragile

`gutenberg_register_widget_type_dependencies()` runs on `init`
priority 20 to ensure `build/widgets.php` (default priority) has
already registered the base script module. If another plugin or
future code changes the registration timing, the re-register
will silently fail. Long-term, the build template should generate
the dynamic dependency list directly.

### `window.__registeredWidgetTypes` global

Follows the same pattern as `unstable__bootstrapServerSideBlockDefinitions`
in `@wordpress/blocks`, but is still a global side-channel. A proper
init module generated by the build system would be cleaner.

### Filter in action creator

`applyFilters( 'widgets.registerWidgetType', ... )` runs inside the
action creator, which is technically a side effect in what should be
a pure function. The blocks package moved this logic into thunks.
For widget-types, this should be refactored when/if two-phase
registration is needed.

## Contributing

See [the contributor documentation](../../docs/contributors/).
