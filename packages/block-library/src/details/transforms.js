import {
	createBlock,
	cloneSanitizedBlock,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';
import { unlock } from '../lock-unlock';

const { isBlockAllowedInParent } = unlock( blocksPrivateApis );

export default {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			isMatch( {}, blocks ) {
				return (
					! (
						blocks.length === 1 &&
						blocks[ 0 ].name === 'core/details'
					) &&
					blocks.every( ( { name } ) =>
						isBlockAllowedInParent( name, 'core/details' )
					)
				);
			},
			__experimentalConvert( blocks ) {
				return createBlock(
					'core/details',
					{},
					blocks.map( ( block ) => cloneSanitizedBlock( block ) )
				);
			},
		},
	],
};
