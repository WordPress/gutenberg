/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { WritingFlow, ObserveTyping, BlockList } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';

export default function BlockView( { isPending } ) {
	const rootClientId = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks()[ 0 ]?.clientId,
		[]
	);

	const { selectBlock } = useDispatch( 'core/block-editor' );

	// Select the root Navigation block when it becomes available.
	useEffect( () => {
		if ( rootClientId ) {
			selectBlock( rootClientId );
		}
	}, [ rootClientId, selectBlock ] );

	return (
		<div className="edit-navigation-editor__block-view">
			{ isPending ? (
				<Spinner />
			) : (
				<div className="editor-styles-wrapper">
					<WritingFlow>
						<ObserveTyping>
							<BlockList />
						</ObserveTyping>
					</WritingFlow>
				</div>
			) }
		</div>
	);
}
