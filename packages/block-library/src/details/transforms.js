/**
 * WordPress dependencies
 */
import {
	createBlock,
	__experimentalCloneSanitizedBlock,
} from '@wordpress/blocks';

export default {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			isMatch( {}, blocks ) {
				return ! (
					blocks.length === 1 && blocks[ 0 ].name === 'core/details'
				);
			},
			__experimentalConvert( blocks ) {
				return createBlock(
					'core/details',
					{},
					blocks.map( ( block ) =>
						__experimentalCloneSanitizedBlock( block )
					)
				);
			},
		},
	],
};
