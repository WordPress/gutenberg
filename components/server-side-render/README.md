ServerSideRender
=======

ServerSideRender component is used for server-side rendering preview in Gutenberg editor, specifically for dynamic blocks. Server-side rendering in a block's `edit` function should be limited for blocks which are heavily dependent on (existing) PHP rendering logic that is heavily intertwined with data, such as when there are no endpoints available.

New blocks should be built in conjunction with any necessary REST API endpoints so that JavaScript can be used for rendering client-side in the `edit` function for the best user experience, instead of relying on using the PHP `render_callback`. The logic necessary for rendering should be included in the endpoint so that both the client-side JS and server-side PHP logic should require a mininal amount of differences.

## Usage

Render core/archives preview.
```jsx
	<ServerSideRender
		block="core/archives"
		attributes={ this.props.attributes }
	/>
```

## Output

Output is using the `render_callback` set when defining the block. For example if `block="core/archives"` as in the example then the output will match `render_callback` output of that block.

## API Endpoint
API endpoint for getting the output for ServerSideRender is `/gutenberg/v1/block-renderer/:block`. It accepts any params which are used as `attributes` for the block's `render_callback` method.

