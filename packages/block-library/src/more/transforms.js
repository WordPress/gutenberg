/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'raw',
			schema: {
				'wp-block': { attributes: [ 'data-block' ] },
			},
			isMatch: ( node ) => node.dataset && node.dataset.block === 'core/more',
			transform( node ) {
				const { customText, noTeaser } = node.dataset;
				const attrs = {};
				// Don't copy unless defined and not an empty string
				if ( customText ) {
					attrs.customText = customText;
				}
				// Special handling for boolean
				if ( noTeaser === '' ) {
					attrs.noTeaser = true;
				}
				return createBlock( 'core/more', attrs );
			},
		},
	],
};

export default transforms;
