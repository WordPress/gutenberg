/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const deprecated = [
	{
		attributes: {
			blockDirection: {
				type: 'string',
				default: 'horizontal',
			},
		},
		migrate() {
			return {
				blockDirection: 'horizontal',
			};
		},
		save() {
			return (
				<div>
					<InnerBlocks.Content />
				</div>
			);
		},
	},
];

export default deprecated;
