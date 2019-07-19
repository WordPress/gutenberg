/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function PostContentEdit() {
	const allowedBlocks = useSelect( ( select ) => {
		return select( 'core/blocks' ).getBlockTypes().filter(
			( { category } ) => category !== 'theme'
		).map( ( { name } ) => name );
	} );
	return (
		<InnerBlocks
			templateLock={ false }
			allowedBlocks={ allowedBlocks }
		/>
	);
}
