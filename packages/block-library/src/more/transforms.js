import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			// Matching, the content schema and the custom text are declared in
			// `block.json`; the teaser flag is not.
			name: 'from-raw',
			transform( node ) {
				const { customText, noTeaser } = node.dataset;
				const attrs = {};
				// Don't copy unless defined and not an empty string.
				if ( customText ) {
					attrs.customText = customText;
				}
				// Special handling for boolean.
				if ( noTeaser === '' ) {
					attrs.noTeaser = true;
				}
				return createBlock( 'core/more', attrs );
			},
		},
	],
};

export default transforms;
