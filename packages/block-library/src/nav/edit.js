/**
 * WordPress dependencies
 */
import {
	__experimentalBlock as Block,
	InnerBlocks,
} from '@wordpress/block-editor';

export default function NavEdit( { attributes: { orientation } } ) {
	return (
		<InnerBlocks
			orientation={ orientation }
			__experimentalCaptureToolbars={ true }
			__experimentalTagName={ Block.nav }
		/>
	);
}
