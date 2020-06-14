/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const deprecated = [
	{
		supports: {
			align: true,
			alignWide: false,
		},
		save() {
			return (
				<div>
					<InnerBlocks.Content />
				</div>
			);
		},
		migrate( attributes ) {
			return omit( attributes, [ 'align' ] );
		},
	},
];

export default deprecated;
