/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { layout } from '@wordpress/icons';
import { forwardRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __experimentalPatternExplorer as PatternExplorer } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function PatternExplorerButton( props, ref ) {
	const [ isModalOpen, setIsModalOpen ] = useState();
	const insertionPoint = useSelect( ( select ) => {
		const { __experimentalGetInsertionPoint } = select( editPostStore );
		return __experimentalGetInsertionPoint();
	}, [] );
	return (
		<>
			<Button
				{ ...props }
				ref={ ref }
				icon={ layout }
				label={ __( 'Pattern explorer' ) }
				onClick={ () => {
					setIsModalOpen( true );
				} }
			/>
			{ isModalOpen && (
				<Modal
					title={ __( 'Pattern explorer' ) }
					closeLabel={ __( 'Close' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName="edit-post-pattern-explorer-button__modal"
					isFullScreen
				>
					<PatternExplorer
						rootClientId={ insertionPoint.rootClientId }
						__experimentalInsertionIndex={
							insertionPoint.insertionIndex
						}
					/>
				</Modal>
			) }
		</>
	);
}

export default forwardRef( PatternExplorerButton );
