/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { InnerBlocks } from '@wordpress/block-editor';

function PostEdit( {
	clientId,
} ) {
	const { hasInnerBlocks, viewEditingMode } = useSelect( ( select ) => {
		const { getBlock } = select( 'core/block-editor' );
		const { getViewEditingMode } = select( 'core/editor' );
		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
			viewEditingMode: getViewEditingMode(),
		};
	}, [ clientId ] );

	return (
		<>
			<InnerBlocks
				showWireframes={ viewEditingMode === 'design' }
				renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
			/>
		</>
	);
}

export default PostEdit;
