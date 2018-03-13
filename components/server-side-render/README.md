ServerSideRender
=======

ServerSideRender component is used for server-side-rendering preview in Gutenberg editor, specifically for dynamic blocks.


## Usage

Render core/latest-posts preview.
```jsx
	<ServerSideRender
		block="core/latest-posts"
		{ this.props.attributes }
	/>
```

## Output

Output is using the `render_callback` set when defining the block. For example if `block="core/latest-posts"` as in the example then the output will match `render_callback` output of that block.

## API Endpoint
API endpoint for getting the output for ServerSideRender is `/gutenberg/v1/blocks-renderer/:block`. It accepts any params which are used as `attributes` for the block's `render_callback` method. 


