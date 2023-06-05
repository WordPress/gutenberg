/**
 * WordPress dependencies
 */
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

function isBlockCritical( blockName ) {
	if ( blockName === 'core/query' || blockName === 'core/post-content' ) {
		return true;
	}
	return false;
}

export function useBlockRemovalWarning() {
	const { getBlockName, getBlockOrder } = useSelect( blockEditorStore );
	const { getBlockType } = useSelect( blocksStore );
	const { displayRemovalPrompt, removeBlocks } =
		useDispatch( blockEditorStore );

	function findFirstCriticalBlock( clientIds ) {
		return clientIds.map( ( clientId ) => {
			const blockName = getBlockName( clientId );
			if ( isBlockCritical( blockName ) ) {
				const blockType = getBlockType( blockName );
				return blockType?.title || blockName;
			}
			const innerBlocks = getBlockOrder( clientId );
			if ( innerBlocks.length ) {
				return findFirstCriticalBlock( innerBlocks );
			}
			return false;
		} );
	}

	return ( clientIds, selectPrevious = true ) => {
		const firstCriticalBlock = findFirstCriticalBlock( clientIds ).find(
			( blockName ) => blockName
		);
		if ( firstCriticalBlock ) {
			displayRemovalPrompt( true, {
				removalFunction: () => {
					removeBlocks( clientIds, selectPrevious );
				},
				blockName: firstCriticalBlock,
			} );
		} else {
			removeBlocks( clientIds, selectPrevious );
		}
	};
}

export function BlockRemovalWarningModal( {
	blockName,
	closeModal,
	removalFunction,
} ) {
	const message =
		blockName === 'core/post-content'
			? __(
					'This block displays the content of a post or page. Removing it it is not advised.'
			  )
			: __(
					'This block displays a list of posts. Removing it is not advised.'
			  );
	const onConfirmRemoval = () => {
		removalFunction();
		closeModal();
	};
	return (
		<Modal
			title={ sprintf(
				/* translators: %s: the name of a menu to delete */
				__( 'Remove %s?' ),
				blockName
			) }
			onRequestClose={ () => closeModal() }
		>
			<p>{ message }</p>
			<HStack justify="right">
				<Button variant="tertiary" onClick={ () => closeModal() }>
					{ __( 'Cancel' ) }
				</Button>
				<Button variant="primary" onClick={ () => onConfirmRemoval() }>
					{ __( 'Confirm' ) }
				</Button>
			</HStack>
		</Modal>
	);
}
