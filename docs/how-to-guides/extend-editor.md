# How to Extend the Editor

The Editor is extended from a plugin, not from a block. This guide is a map of the extension points available to a plugin: where you can add interface of your own, which filters let you change how existing blocks behave, and how to persist the data your extension collects.

Each section links to the reference page that documents the API in full, so treat this page as a starting point rather than a complete API listing.

There are four extension points, and picking the right one is usually the whole decision:

-   **SlotFills** render your own React components inside places the Editor sets aside for them, such as the sidebar or the block settings menu.
-   **Editor and block filters** change the behavior of blocks and Editor internals that are already registered, without adding interface of your own.
-   **Block variations** ship a preconfigured version of an existing block instead of a new block type.
-   **Custom blocks** are the right choice when the content itself is new, not just its presentation.

Custom blocks are covered by the [Create a Block tutorial](/docs/getting-started/devenv/get-started-with-create-block.md); the other three are covered below.

## Extend the interface with SlotFills

The Editor exposes a set of slots. A plugin renders a fill into one of them, and the Editor places it in the right part of the interface. Every fill lives inside a plugin registered with [`registerPlugin`](/packages/plugins/README.md), which is what mounts your components into the Editor:

```jsx
import { registerPlugin } from '@wordpress/plugins';

registerPlugin( 'my-plugin', {
	render: MyPluginFills,
} );
```

The components below are exported from `@wordpress/editor`. `@wordpress/edit-post` still re-exports them, but those aliases have been deprecated since WordPress 6.6 and log a warning, so import from `@wordpress/editor`. For the full list of slots, see the [SlotFills reference](/docs/reference-guides/slotfills/README.md).

### Add a sidebar

`PluginSidebar` adds a panel alongside the block settings sidebar, together with an icon to open it.

```jsx
import { PluginSidebar, store as editorStore } from '@wordpress/editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';

function SubtitleSidebar() {
	const subtitle = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'meta' )
				?.my_plugin_subtitle ?? '',
		[]
	);
	const { editPost } = useDispatch( editorStore );

	return (
		<PluginSidebar
			name="my-plugin-subtitle"
			title={ __( 'Subtitle' ) }
			icon={ pencil }
		>
			<PanelBody>
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Subtitle' ) }
					value={ subtitle }
					onChange={ ( value ) =>
						editPost( { meta: { my_plugin_subtitle: value } } )
					}
				/>
			</PanelBody>
		</PluginSidebar>
	);
}
```

`getEditedPostAttribute` returns the value including edits the user has not saved yet, which is what you want for a control that writes back to the same field. The meta key has to be registered in PHP before either call works; see [Store data in post meta](#store-data-in-post-meta).

### Add a panel to the Document sidebar

`PluginDocumentSettingPanel` renders below the Status & Availability panel, next to the post's own settings. Use it for a setting that belongs to the document, where a dedicated sidebar would be too much.

```jsx
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

function ReviewPanel() {
	return (
		<PluginDocumentSettingPanel
			name="my-plugin-review"
			title={ __( 'Editorial review' ) }
		>
			{ /* Controls for the review workflow. */ }
		</PluginDocumentSettingPanel>
	);
}
```

The `name` is required and must be unique within your plugin; it is what users pin or hide from the preferences modal.

### Add an item to the block settings menu

`PluginBlockSettingsMenuItem` adds an entry to the menu behind the three-dot button on a block.

```jsx
import { PluginBlockSettingsMenuItem } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

function CopyPromptMenuItem() {
	return (
		<PluginBlockSettingsMenuItem
			allowedBlocks={ [ 'core/paragraph' ] }
			icon="admin-tools"
			label={ __( 'Send to review' ) }
			onClick={ sendSelectionToReview }
		/>
	);
}
```

Without `allowedBlocks` the item shows for every block. With it, and with several blocks selected, the item only shows when every selected block is in the list.

### Add a pre-publish check

`PluginPrePublishPanel` renders in the panel that opens when a user first presses Publish, which makes it the place for a last check before the post goes live.

```jsx
import { PluginPrePublishPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

function ChecklistPanel() {
	return (
		<PluginPrePublishPanel
			title={ __( 'Publishing checklist' ) }
			initialOpen
		>
			{ /* Warnings or reminders for the author. */ }
		</PluginPrePublishPanel>
	);
}
```

The panel starts collapsed unless you pass `initialOpen`, except when no `title` is given, in which case it is always open.

## Modify blocks with filters

Filters let you change registered blocks without owning them. They are added with [`addFilter`](/packages/hooks/README.md) from a script enqueued on `enqueue_block_editor_assets`.

### Change a block's settings

`blocks.registerBlockType` receives every block's settings as they are registered, which is where you add an attribute or adjust a block's supports. It only applies to blocks registered after the filter is added, so add it at the top level of your script rather than inside a callback that runs later.

```js
import { addFilter } from '@wordpress/hooks';

function addSubtitleAttribute( settings, name ) {
	if ( name !== 'core/paragraph' ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			mySubtitle: {
				type: 'string',
				default: '',
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'my-plugin/subtitle-attribute',
	addSubtitleAttribute
);
```

An attribute added this way is not saved on its own. Unless it has a `source`, it is serialized into the block's comment delimiter, and for a static block that changes the saved markup, so existing content is flagged as invalid. [Block filters](/docs/reference-guides/filters/block-filters.md) covers the ways to handle this, including `blocks.getSaveContent.extraProps`.

### Wrap a block's edit component

`editor.BlockEdit` wraps the component a block renders in the Editor. The filter receives a component and must return one; `createHigherOrderComponent` is the convention used throughout the codebase, and it names the wrapper so the tree stays readable in React DevTools.

```jsx
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const withSubtitleControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( props.name !== 'core/paragraph' ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody title={ __( 'Subtitle' ) }>
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'Subtitle' ) }
							value={ props.attributes.mySubtitle }
							onChange={ ( mySubtitle ) =>
								props.setAttributes( { mySubtitle } )
							}
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, 'withSubtitleControl' );

addFilter(
	'editor.BlockEdit',
	'my-plugin/subtitle-control',
	withSubtitleControl
);
```

Returning early for blocks you do not target matters here: the filter runs for every block in the Editor.

For filters on the Editor itself rather than on blocks, see [Editor filters](/docs/reference-guides/filters/editor-filters.md).

## Register a block variation

A variation is an existing block with different starting attributes and inner blocks, listed in the inserter under its own name. Reach for one when the block you need already exists and only its defaults differ.

```js
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

registerBlockVariation( 'core/group', {
	name: 'my-plugin-callout',
	title: __( 'Callout' ),
	attributes: {
		className: 'my-plugin-callout',
	},
	innerBlocks: [ [ 'core/heading', { level: 3 } ], [ 'core/paragraph' ] ],
	scope: [ 'inserter' ],
} );
```

Without `scope`, the variation is active in every scope, which includes matching against existing blocks. See [Block variations](/docs/reference-guides/block-api/block-variations.md) for the scopes and for how a variation is matched back to a block.

## Store data in post meta

Meta fields are the usual place for data an extension collects about a post. Register the field in PHP with `show_in_rest` so the Editor can read and write it:

```php
function my_plugin_register_meta() {
	register_post_meta(
		'post',
		'my_plugin_subtitle',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
			'default'      => '',
		)
	);
}
add_action( 'init', 'my_plugin_register_meta' );
```

From JavaScript, read the field with `getEditedPostAttribute( 'meta' )` and write it with `editPost`, as in the sidebar example above. Both go through the `core/editor` store, so the value is part of the post's unsaved edits and is saved with the post rather than in a request of its own.

## Guidelines

Build the interface out of [`@wordpress/components`](/packages/components/README.md) so your extension inherits the Editor's styling, keyboard behavior, and accessibility work rather than reimplementing it. Wrap every string a user reads in `__()` from [`@wordpress/i18n`](/packages/i18n/README.md), and follow the [copy guidelines](/docs/contributors/documentation/copy-guide.md) when writing them.

## Related resources

-   [SlotFills reference](/docs/reference-guides/slotfills/README.md)
-   [Block filters](/docs/reference-guides/filters/block-filters.md) and [Editor filters](/docs/reference-guides/filters/editor-filters.md)
-   [Plugin sidebar tutorial](/docs/how-to-guides/plugin-sidebar-0.md), a worked example of the sidebar and meta field above
-   [Block variations](/docs/reference-guides/block-api/block-variations.md)
-   [Curating the Editor experience](/docs/how-to-guides/curating-the-editor-experience/README.md), for locking down the Editor rather than adding to it
