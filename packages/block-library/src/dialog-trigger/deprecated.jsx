/**
 * WordPress Dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const deprecated = [
	{
		attributes: {
			allowedBlocks: {
				type: 'array',
			},
			disengageClickHandler: {
				type: 'boolean',
				default: false,
			},
		},
		// Previous version had no wrapper markup in save; it only saved inner blocks
		save() {
			return <InnerBlocks.Content />;
		},
	},
];

export default deprecated;
