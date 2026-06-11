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
				// The code block may output HTML formatting, so convert it
				// to plain text.
				return createBlock(
					'core/html',
					{},
					[],
					[ create( { html } ).text ]
				);
			},
		},
	],
};

export default transforms;
