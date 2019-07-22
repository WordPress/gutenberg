/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function PostContentEdit( { clientId } ) {
	const allowedBlocks = useSelect( ( select ) => {
		return select( 'core/blocks' ).getBlockTypes().filter(
			( { category } ) => category !== 'theme'
		).map( ( { name } ) => name );
	} );

	const { hasInnerBlocks } = useSelect( ( select ) => {
		const { getBlock } = select( 'core/block-editor' );
		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	}, [ clientId ] );

	return (
		<InnerBlocks
			templateLock={ false }
			allowedBlocks={ allowedBlocks }
			renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
		/>
	);
}
