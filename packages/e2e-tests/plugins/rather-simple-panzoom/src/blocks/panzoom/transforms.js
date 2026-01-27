/**
 * WordPress dependencies
 */
import {
	createBlock
} from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: ['core/image'],
			transform: (attributes) => {
				return createBlock(
					'occ/rather-simple-panzoom',
					{
						id: attributes.id,
						url: attributes.url,
						alt: attributes.alt,
					}
				);
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: ['core/image'],
			transform: (attributes) => {
				return createBlock(
					'core/image',
					{
						id: attributes.id,
						url: attributes.url,
						alt: attributes.alt,
					}
				)
			},
		}
	]
}

export default transforms;