# Edit Post

Edit Post Module for WordPress.

> This package is meant to be used only with WordPress core. Feel free to use it in your own project but please keep in mind that it might never get fully documented.

## Installation

Install the module

```bash
npm install @wordpress/edit-post
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Extending the post editor UI

Extending the editor UI can be accomplished with the `registerPlugin` API, allowing you to define all your plugin's UI elements in one place.

Refer to [the plugins module documentation](/packages/plugins/README.md) for more information.

## Plugin Components

The following components can be used with the `registerPlugin` ([see documentation](/packages/plugins/README.md)) API.
They can be found in the global variable `wp.editPost` when defining `wp-edit-post` as a script dependency.

### `PluginBlockSettingsMenuItem`

Renders a new item in the block settings menu.

Example:

{% codetabs %}

{% ES5 %}
```js
var __ = wp.i18n.__;
var PluginBlockSettingsMenuItem = wp.editPost.PluginBlockSettingsMenuItem;

function doOnClick(){
	// To be called when the user clicks the menu item.
}

function MyPluginBlockSettingsMenuItem() {
	return wp.element.createElement(
		PluginBlockSettingsMenuItem,
		{
			allowedBlockNames: [ 'core/paragraph' ],
			icon: 'dashicon-name',
			label: __( 'Menu item text' ),
			onClick: doOnClick,
		}
	);
}
```

{% ESNext %}
```jsx
import { __ } from wp.i18n;
import { PluginBlockSettingsMenuItem } from wp.editPost;

const doOnClick = ( ) => {
    // To be called when the user clicks the menu item.
};

const MyPluginBlockSettingsMenuItem = () => (
    <PluginBlockSettingsMenuItem
		allowedBlockNames=[ 'core/paragraph' ]
		icon='dashicon-name'
		label=__( 'Menu item text' )
		onClick={ doOnClick } />
);
```

{% end %}

#### Props

##### allowedBlockNames

An array containing a whitelist of block names for which the item should be shown. If this prop is not present the item will be rendered for any block. If multiple blocks are selected, it'll be shown if and only if all of them are in the whitelist.

- Type: `Array`
- Required: No
- Default: Menu item is shown for any block

##### icon

The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered to the left of the menu item label.

- Type: `String` | `Element`
- Required: No
- Default: Menu item wil be rendered without icon

##### label

A string containing the menu item text.

- Type: `String`
- Required: Yes

##### onClick

The callback function to be executed when the user clicks the menu item.

- Type: `function`
- Required: Yes

### `PluginSidebar`

Renders a sidebar when activated. The contents within the `PluginSidebar` will appear as content within the sidebar.

If you wish to display the sidebar, you can with use the [`PluginSidebarMoreMenuItem`](#pluginsidebarmoremenuitem) component or the `wp.data.dispatch` API:

```js
wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/sidebar-name' );
```

_Example:_

{% codetabs %}

{% ES5 %}
```js
var __ = wp.i18n.__;
var el = wp.element.createElement;
var PanelBody = wp.components.PanelBody;
var PluginSidebar = wp.editPost.PluginSidebar;


function MyPluginSidebar() {
	return el(
			PluginSidebar,
			{
				name: 'my-sidebar',
				title: 'My sidebar title',
				icon: 'smiley',
			},
			el(
				PanelBody,
				{},
				__( 'My sidebar content' )
			)
	);
}
```

{% ESNext %}
```jsx
const { __ } = wp.i18n;
const { PanelBody } = wp.components;
const { PluginSidebar } = wp.editPost;

const MyPluginSidebar = () => (
	<PluginSidebar
		name="my-sidebar"
		title="My sidebar title"
		icon="smiley"
	>
		<PanelBody>
			{ __( 'My sidebar content' ) }
		</PanelBody>
	</PluginSidebar>
);
```
{% end %}

#### Props

##### name

A string identifying the sidebar. Must be unique for every sidebar registered within the scope of your plugin.

- Type: `String`
- Required: Yes

##### className

An optional class name added to the sidebar body.

- Type: `String`
- Required: No

##### title

Title displayed at the top of the sidebar.

- Type: `String`
- Required: Yes

##### isPinnable

Whether to allow to pin sidebar to toolbar.

- Type: `Boolean`
- Required: No
- Default: `true`

##### icon

The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered when the sidebar is pinned to toolbar.

- Type: `String` | `Element`
- Required: No
- Default: _inherits from the plugin_

### `PluginMoreMenuItem`

Renders a menu item in `Plugins` group in `More Menu` drop down, and can be used to as a button or link depending on the props provided.
The text within the component appears as the menu item label.

_Example:_

{% codetabs %}

{% ES5 %}
```js
var __ = wp.i18n.__;
var PluginMoreMenuItem = wp.editPost.PluginMoreMenuItem;

function onButtonClick() {
	alert( 'Button clicked.' );
}

function MyButtonMoreMenuItem() {
	return wp.element.createElement(
		PluginMoreMenuItem,
		{
			icon: 'smiley',
			onClick: onButtonClick
		},
		__( 'My button title' )
	)
}
```

{% ESNext %}
```jsx
const { __ } = wp.i18n;
const { PluginMoreMenuItem } = wp.editPost;

function onButtonClick() {
	alert( 'Button clicked.' );
}

const MyButtonMoreMenuItem = () => (
	<PluginMoreMenuItem
		icon="smiley"
		onClick={ onButtonClick }
	>
		{ __( 'My button title' ) }
	</PluginMoreMenuItem>
);
```
{% end %}

#### Props

`PluginMoreMenuItem` supports the following props. Any additional props are passed through to the underlying [MenuItem](/packages/components/src/menu-item/README.md) component.

##### href

When `href` is provided then the menu item is represented as an anchor rather than button. It corresponds to the `href` attribute of the anchor.

- Type: `String`
- Required: No

##### icon

The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered to the left of the menu item label.

- Type: `String` | `Element`
- Required: No
- Default: _inherits from the plugin_

##### onClick

The callback function to be executed when the user clicks the menu item.

- Type: `function`
- Required: No
- Default: _function which does nothing_

### `PluginSidebarMoreMenuItem`

Renders a menu item in `Plugins` group in `More Menu` drop down, and can be used to activate the corresponding `PluginSidebar` component.
The text within the component appears as the menu item label.

_Example:_

{% codetabs %}

{% ES5 %}
```js
var __ = wp.i18n.__;
var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;

function MySidebarMoreMenuItem() {
	return wp.element.createElement(
		PluginSidebarMoreMenuItem,
		{
			target: 'my-sidebar',
			icon: 'smiley',
		},
		__( 'My sidebar title' )
	)
}
```

{% ESNext %}
```jsx
const { __ } = wp.i18n;
const { PluginSidebarMoreMenuItem } = wp.editPost;

const MySidebarMoreMenuItem = () => (
	<PluginSidebarMoreMenuItem
		target="my-sidebar"
		icon="smiley"
	>
		{ __( 'My sidebar title' ) }
	</PluginSidebarMoreMenuItem>
);
```
{% end %}

#### Props

##### target

A string identifying the target sidebar you wish to be activated by this menu item. Must be the same as the `name` prop you have given to that sidebar.

- Type: `String`
- Required: Yes

##### icon

The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered to the left of the menu item label.

- Type: `String` | `Element`
- Required: No
- Default: _inherits from the plugin_


### `PluginPostStatusInfo`

Renders a row in the Status & Visibility panel of the Document sidebar.
It should be noted that this is named and implemented around the function it serves and not its location, which may change in future iterations.

_Example:_

{% codetabs %}

{% ES5 %}
```js
var __ = wp.i18n.__;
var PluginPostStatusInfo = wp.editPost.PluginPostStatusInfo;

function MyPluginPostStatusInfo() {
	return wp.element.createElement(
		PluginPostStatusInfo,
		{
			className: 'my-plugin-post-status-info',
		},
		__( 'My post status info' )
	)
}
```

{% ESNext %}
```jsx
const { __ } = wp.i18n;
const { PluginPostStatusInfo } = wp.editPost;

const MyPluginPostStatusInfo = () => (
	<PluginPostStatusInfo
		className="my-plugin-post-status-info"
	>
		{ __( 'My post status info' ) }
	</PluginPostStatusInfo>
);
```
{% end %}

#### Props

##### className

An optional class name added to the row.

- Type: `String`
- Required: No

### `PluginPrePublishPanel`

Renders provided content to the pre-publish side panel in the publish flow (side panel that opens when a user first pushes "Publish" from the main editor).

_Example:_

{% codetabs %}

{% ES5 %}
```js
var __ = wp.i18n.__;
var PluginPrePublishPanel = wp.editPost.PluginPrePublishPanel;

function MyPluginPrePublishPanel() {
	return wp.element.createElement(
		PluginPrePublishPanel,
		{
			className: 'my-plugin-pre-publish-panel',
			title: __( 'My panel title' ),
			initialOpen: true,
		},
		__( 'My panel content' )
	);
}
```

{% ESNext %}
```jsx
const { __ } = wp.i18n;
const { PluginPrePublishPanel } = wp.editPost;

const MyPluginPrePublishPanel = () => (
	<PluginPrePublishPanel
		className="my-plugin-pre-publish-panel"
		title={ __( 'My panel title' ) }
		initialOpen={ true }
	>
	    { __( 'My panel content' ) }
	</PluginPrePublishPanel>
);
```
{% end %}

#### Props

##### className

An optional class name added to the panel.

- Type: `String`
- Required: No

##### title

Title displayed at the top of the panel.

- Type: `String`
- Required: No

##### initialOpen

Whether to have the panel initially opened. When no title is provided it is always opened.

- Type: `Boolean`
- Required: No
- Default: `false`


### `PluginPostPublishPanel`

Renders provided content to the post-publish panel in the publish flow (side panel that opens after a user publishes the post).

_Example:_

{% codetabs %}

{% ES5 %}
```js
var __ = wp.i18n.__;
var PluginPostPublishPanel = wp.editPost.PluginPostPublishPanel;

function MyPluginPostPublishPanel() {
	return wp.element.createElement(
		PluginPostPublishPanel,
		{
			className: 'my-plugin-post-publish-panel',
			title: __( 'My panel title' ),
			initialOpen: true,
		},
		__( 'My panel content' )
	);
}
```

{% ESNext %}
```jsx
const { __ } = wp.i18n;
const { PluginPostPublishPanel } = wp.editPost;

const MyPluginPostPublishPanel = () => (
	<PluginPostPublishPanel
		className="my-plugin-post-publish-panel"
		title={ __( 'My panel title' ) }
		initialOpen={ true }
	>
        { __( 'My panel content' ) }
	</PluginPostPublishPanel>
);
```
{% end %}

#### Props

##### className

An optional class name added to the panel.

- Type: `String`
- Required: No

##### title

Title displayed at the top of the panel.

- Type: `String`
- Required: No

##### initialOpen

Whether to have the panel initially opened. When no title is provided it is always opened.

- Type: `Boolean`
- Required: No
- Default: `false`


<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
