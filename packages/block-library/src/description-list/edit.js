/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [ 'core/description-term', 'core/description-details' ];
const TEMPLATE = [
	[ 'core/description-term' ],
	[ 'core/description-details' ],
];

export default function Edit() {
	return (
		<InnerBlocks
			allowedBlocks={ ALLOWED_BLOCKS }
			template={ TEMPLATE }
			__experimentalTagName={ Block.dl }
		/>
	);
}
