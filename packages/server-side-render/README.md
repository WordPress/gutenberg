# ServerSideRender

ServerSideRender is a component used for server-side rendering a preview of dynamic blocks to display in the editor. Server-side rendering in a block's `edit` function should be limited to blocks that are heavily dependent on existing PHP rendering logic that is heavily intertwined with data, particularly when there are no endpoints available.

ServerSideRender may also be used when a legacy block is provided as a backward compatibility measure, rather than needing to re-write the deprecated code that the block may depend on.

ServerSideRender should be regarded as a fallback or legacy mechanism, it is not appropriate for developing new features against.

New blocks should be built in conjunction with any necessary REST API endpoints, so that JavaScript can be used for rendering client-side in the `edit` function. This gives the best user experience, instead of relying on using the PHP `render_callback`. The logic necessary for rendering should be included in the endpoint, so that both the client-side JavaScript and server-side PHP logic should require a minimal amount of differences.

> This package is meant to be used only with WordPress core. Feel free to use it in your own project but please keep in mind that it might never get fully documented.

## Installation

Install the module

```bash
npm install @wordpress/server-side-render --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

The props accepted by the component are described below.


## Props

### attributes

An object containing the attributes of the block to be server-side rendered.
E.g: `{ displayAsDropdown: true }`, `{ showHierarchy: true }`, etc...
- Type: `Object`
- Required: No

### block

The identifier of the block to be server-side rendered.
Examples: "core/archives", "core/latest-comments", "core/rss", etc...
- Type: `String`
- Required: Yes

### className

A class added to the DOM element that wraps the server side rendered block.
Examples: "my-custom-server-side-rendered".
- Type: `String`
- Required: No

### urlQueryArgs

Query arguments to apply to the request URL.
E.g: `{ post_id: 12 }`.
- Type: `Object`
- Required: No

## Usage

Render core/archives preview.

```jsx
import { ServerSideRender } from '@wordpress/server-side-render';

const MyServerSideRender = () => (
	<ServerSideRender
		block="core/archives"
		attributes={ {
			showPostCounts: true,
			displayAsDropdown: false,
		} }
	/>
);
```

## Output

Output uses the block's `render_callback` function, set when defining the block.

## API Endpoint

The API endpoint for getting the output for ServerSideRender is `/wp/v2/block-renderer/:block`. It will use the block's `render_callback` method.

If you pass `attributes` to `ServerSideRender`, the block must also be registered and have its attributes defined in PHP.

```php
register_block_type(
	'core/archives',
	array(
		'attributes'      => array(
			'showPostCounts'    => array(
				'type'      => 'boolean',
				'default'   => false,
			),
			'displayAsDropdown' => array(
				'type'      => 'boolean',
				'default'   => false,
			),
		),
		'render_callback' => 'render_block_core_archives',
	)
);
```
