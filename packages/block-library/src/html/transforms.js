/**
 * WordPress dependencies
 */
import { createBlock, parse } from '@wordpress/blocks';
import { create } from '@wordpress/rich-text';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( { content: html } ) => {
				// The code block may output HTML formatting, so convert it
				// to plain text, then parse it so any block delimiters become
				// editable inner blocks at their positions within the static
				// HTML, rather than inert comment text.
				const text = create( { html } ).text;
				const [ block ] = parse(
					`<!-- wp:html -->\n${ text }\n<!-- /wp:html -->`
				);

				return block ?? createBlock( 'core/html', {}, [], [ text ] );
			},
		},
	],
};

export default transforms;
