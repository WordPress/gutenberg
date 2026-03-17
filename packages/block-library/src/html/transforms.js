/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create } from '@wordpress/rich-text';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( { content: html } ) => {
				return createBlock( 'core/html', {
					// The code block may output HTML formatting, so convert it
					// to plain text.
					content: create( { html } ).text,
				} );
			},
		},
	],
};

export default transforms;
