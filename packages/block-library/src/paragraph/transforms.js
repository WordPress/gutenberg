import { createBlock, getBlockAttributes } from '@wordpress/blocks';
import metadata from './block.json';

const { name } = metadata;

const transforms = {
	from: [
		{
			// Matching and the content schema are declared in `block.json`;
			// this supplies the text alignment, which cannot be.
			name: 'from-raw',
			transform( node ) {
				const attributes = getBlockAttributes( name, node.outerHTML );
				const { textAlign } = node.style || {};

				if (
					textAlign === 'left' ||
					textAlign === 'center' ||
					textAlign === 'right'
				) {
					attributes.style = {
						...attributes.style,
						typography: {
							...attributes.style?.typography,
							textAlign,
						},
					};
				}

				return createBlock( name, attributes );
			},
		},
	],
};

export default transforms;
