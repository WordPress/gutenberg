# Extending the Editor

The Editor is extended from a plugin, not from a block. This guide is a map of the extension points available to a plugin: where you can add your own interface, which filters let you change how existing blocks behave, and how to persist the data your extension collects.

Each section links to the reference page that documents the API in full, so treat this page as a starting point rather than a complete API listing.

There are four extension points, and picking the right one is usually the whole decision:

-   [**SlotFills**](#extend-the-interface-with-slotfills) render your own React components inside places the Editor sets aside for them, such as the sidebar or the block settings menu. Reference: [SlotFills](/docs/reference-guides/slotfills/README.md).
-   [**Editor and block filters**](#modify-blocks-with-filters) change the behavior of blocks and Editor internals that are already registered, without adding an interface of your own. Reference: [Block filters](/docs/reference-guides/filters/block-filters.md) and [Editor filters](/docs/reference-guides/filters/editor-filters.md).
-   [**Block variations**](#register-a-block-variation) ship a preconfigured version of an existing block instead of a new block type. Reference: [Block variations](/docs/reference-guides/block-api/block-variations.md).
-   **Custom blocks** are the right choice when the content itself is new, not just its presentation. Start with [Build your first block](/docs/getting-started/tutorial.md).

Custom blocks are covered by that tutorial; the other three are covered below.

The examples below build up one small plugin, a subtitle field stored in post meta with a few pieces of interface around it. They are meant to be pasted into a single script file in that order; [Register the fills](#register-the-fills) at the end wires them together and is what makes any of them appear.

## Extend the interface with SlotFills

The Editor exposes a set of slots. A plugin renders a fill into one of them, and the Editor places it in the right part of the interface. Nothing renders until the fills are mounted by a plugin registered with [`registerPlugin`](/packages/plugins/README.md), which is the last step of this section.

Import the components below from `@wordpress/editor`; older tutorials import them from `@wordpress/edit-post`, which has been deprecated since WordPress 6.6. For the full list of slots, see the [SlotFills reference](/docs/reference-guides/slotfills/README.md).

### Add a sidebar

[`PluginSidebar`](/docs/reference-guides/slotfills/plugin-sidebar.md) adds a panel of your own to the sidebar region, in the same place the block settings sidebar opens, together with an icon in the header to switch to it.

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

![The sidebar, open next to the editor canvas, with its icon active in the header](https://developer.wordpress.org/files/2026/08/extend-editor-plugin-sidebar.png)

### Add a panel to the Document sidebar

[`PluginDocumentSettingPanel`](/docs/reference-guides/slotfills/plugin-document-setting-panel.md) renders in the Post tab of the document sidebar, below the post's own summary of Status, Publish, Slug, and so on, and above Categories and Tags. Use it for a setting that belongs to the document, where a dedicated sidebar would be too much.

```jsx
import {
    PluginDocumentSettingPanel,
    store as editorStore,
} from '@wordpress/editor';
import { TextControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function ReviewPanel() {
    const reviewer = useSelect(
        ( select ) =>
            select( editorStore ).getEditedPostAttribute( 'meta' )
                ?.my_plugin_reviewer ?? '',
        []
    );
    const { editPost } = useDispatch( editorStore );

    return (
        <PluginDocumentSettingPanel
            name="my-plugin-review"
            title={ __( 'Editorial review' ) }
        >
            <TextControl
                __nextHasNoMarginBottom
                label={ __( 'Reviewer' ) }
                value={ reviewer }
                onChange={ ( value ) =>
                    editPost( { meta: { my_plugin_reviewer: value } } )
                }
            />
        </PluginDocumentSettingPanel>
    );
}
```

The `name` is required and must be unique within your plugin; it is what identifies the panel under Preferences → Panels, where a user can hide it. Unlike `PluginSidebar`, a document panel cannot be pinned to the toolbar.

![The Editorial review panel expanded in the Post tab of the document sidebar, below Format and above Categories](https://developer.wordpress.org/files/2026/08/extend-editor-document-setting-panel.png)

### Add an item to the block settings menu

[`PluginBlockSettingsMenuItem`](/docs/reference-guides/slotfills/plugin-block-settings-menu-item.md) adds an entry to the menu behind the three-dot button on a block.

```jsx
import { PluginBlockSettingsMenuItem } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf, _n } from '@wordpress/i18n';

function SendToReviewMenuItem() {
    const selectedBlockCount = useSelect(
        ( select ) =>
            select( blockEditorStore ).getSelectedBlockClientIds().length,
        []
    );
    const { createSuccessNotice } = useDispatch( noticesStore );

    return (
        <PluginBlockSettingsMenuItem
            allowedBlocks={ [ 'core/paragraph' ] }
            icon="admin-tools"
            label={ __( 'Send to review' ) }
            onClick={ () =>
                createSuccessNotice(
                    sprintf(
                        /* translators: %d: number of blocks sent for review. */
                        _n(
                            '%d block sent for review.',
                            '%d blocks sent for review.',
                            selectedBlockCount
                        ),
                        selectedBlockCount
                    ),
                    { type: 'snackbar' }
                )
            }
        />
    );
}
```

The notice stands in for whatever your plugin does with the selection; the point is that `onClick` runs in a component, so the `core/block-editor` store tells you which blocks the user has selected.

Without `allowedBlocks` the item shows for every block. With it, and with several blocks selected, the item only shows when every selected block is in the list.

![The block settings menu open on a paragraph, with a Send to review item between Hide and Create pattern](https://developer.wordpress.org/files/2026/08/extend-editor-block-settings-menu-item.png)

### Add a pre-publish check

[`PluginPrePublishPanel`](/docs/reference-guides/slotfills/plugin-pre-publish-panel.md) renders in the panel that opens when a user first presses Publish, which makes it the place for a last check before the post goes live.

```jsx
import { PluginPrePublishPanel, store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function ChecklistPanel() {
    const hasSubtitle = useSelect(
        ( select ) =>
            !! select( editorStore ).getEditedPostAttribute( 'meta' )
                ?.my_plugin_subtitle,
        []
    );

    return (
        <PluginPrePublishPanel
            title={ __( 'Publishing checklist' ) }
            initialOpen
        >
            <p>
                { hasSubtitle
                    ? __( 'This post has a subtitle.' )
                    : __( 'This post has no subtitle yet.' ) }
            </p>
        </PluginPrePublishPanel>
    );
}
```

The panel starts collapsed unless you pass `initialOpen`, except when no `title` is given, in which case it is always open.

![The pre-publish panel with a Publishing checklist section open below Visibility and Publish](https://developer.wordpress.org/files/2026/08/extend-editor-pre-publish-panel.png)

### Register the fills

None of the four components above render on their own. Mount them with a single `registerPlugin` call:

```jsx
import { registerPlugin } from '@wordpress/plugins';

function MyPluginFills() {
    return (
        <>
            <SubtitleSidebar />
            <ReviewPanel />
            <SendToReviewMenuItem />
            <ChecklistPanel />
        </>
    );
}

registerPlugin( 'my-plugin', { render: MyPluginFills } );
```

The plugin name must start with a letter and contain only lowercase letters, numbers, and dashes. An invalid name is not an exception: `registerPlugin` logs an error to the console, registers nothing, and returns `null`, so the symptom you see is fills that never render. Each fill still decides where it appears, so one plugin can mount as many as it needs.

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

Unless it has a [`source`](/docs/reference-guides/block-api/block-attributes.md#value-source), the attribute is stored in the block's comment delimiter rather than in its markup. That is safe for existing content: [block validation](/docs/reference-guides/block-api/block-edit-save.md#validation) compares the output of the block's `save` function against the markup already in the post, and the delimiter is not part of that comparison.

Getting the value into the saved markup is the separate step, and the one to be careful with. [`blocks.getSaveContent.extraProps`](/docs/reference-guides/filters/block-filters.md#blocksgetsavecontentextraprops) changes what `save` produces, so posts written before your filter existed no longer match and are flagged as invalid. Handling that is what [block deprecations](/docs/reference-guides/block-api/block-deprecation.md) are for: each deprecation describes an older shape of the block so the Editor can migrate it instead of showing a recovery prompt.

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

A variation is an existing block with different starting attributes and inner blocks, listed in the inserter under its own name. Reach for one when the block you need already exists and only its defaults differ. [`registerBlockVariation`](/docs/reference-guides/block-api/block-variations.md) takes the block name and the variation.

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

`scope` defaults to `[ 'block', 'inserter' ]`, so leaving it out also makes the variation available to blocks that present a variation picker, such as Columns and Query. See [Block variations](/docs/reference-guides/block-api/block-variations.md) for the three scopes and for how a variation is matched back to a block.

## Store data in post meta

Post meta is the usual place for data an extension collects about a post, and the sidebar and the document panel above each write to a field of their own. The Editor reaches meta through the REST API, so a field is only visible to it once it is registered with `show_in_rest`:

```php
function my_plugin_register_meta() {
    $fields = array( 'my_plugin_subtitle', 'my_plugin_reviewer' );

    foreach ( $fields as $field ) {
        register_post_meta(
            'post',
            $field,
            array(
                'show_in_rest' => true,
                'single'       => true,
                'type'         => 'string',
                'default'      => '',
            )
        );
    }
}
add_action( 'init', 'my_plugin_register_meta' );
```

Read a meta field with `getEditedPostAttribute( 'meta' )` and write it with `editPost`, as in the two examples above. Both go through the [`core/editor` store](/docs/reference-guides/data/data-core-editor.md), so the value becomes part of the post's unsaved edits instead of being saved in a request of its own.

## Guidelines

Compose the interface from [`@wordpress/components`](/packages/components/README.md), as every example above does. Those components already carry the Editor's styling, keyboard behavior, and accessibility work, so your extension inherits all three instead of reimplementing them and drifting from the rest of the Editor as it changes.

Wrap every string a user reads in `__()` from [`@wordpress/i18n`](/packages/i18n/README.md) so it can be translated, and follow the [copy guidelines](/docs/contributors/documentation/copy-guide.md) when writing them.

## Related resources

-   [SlotFills reference](/docs/reference-guides/slotfills/README.md)
-   [Block filters](/docs/reference-guides/filters/block-filters.md) and [Editor filters](/docs/reference-guides/filters/editor-filters.md)
-   [Plugin sidebar tutorial](/docs/how-to-guides/plugin-sidebar-0.md), a working example of the sidebar and meta field above
-   [Block variations](/docs/reference-guides/block-api/block-variations.md)
-   [Curating the Editor experience](/docs/how-to-guides/curating-the-editor-experience/README.md), for locking down the Editor rather than adding to it

