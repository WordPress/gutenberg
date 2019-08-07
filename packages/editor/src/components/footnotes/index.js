/**
 * WordPress dependencies
 */
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Edit from './edit';

export default function Footnotes() {
	return getBlockTypes()
		.filter( ( { category } ) => category === 'footnotes' )
		.map( ( blockType, index ) =>
			<Edit key={ index } blockType={ blockType } />
		);
}
