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

const blockTypePromptMessages = {
	'core/query': __(
		'Query loop displays a list of posts. Removing it is not advised.'
	),

	'core/post-content': __(
		'Post Content displays the content of a post or page. Removing it it is not advised.'
	),
};

export function useBlockRemovalWarning() {
	const { getBlockName, getBlockOrder } = useSelect( blockEditorStore );
	const { displayRemovalPrompt, removeBlocks } =
		useDispatch( blockEditorStore );

	function getBlocksToPromptFor( clientIds ) {
		return clientIds.flatMap( ( clientId ) => {
			const found = [];
			const blockName = getBlockName( clientId );
			if ( isBlockCritical( blockName ) ) {
				found.push( blockName );
			}
			const innerBlocks = getBlockOrder( clientId );
			return found.concat( getBlocksToPromptFor( innerBlocks ) );
		} );
	}

	return ( clientIds, selectPrevious = true ) => {
		const blocksToPromptFor = getBlocksToPromptFor( clientIds );

		if ( blocksToPromptFor.length ) {
			displayRemovalPrompt( true, {
				removalFunction: () => {
					removeBlocks( clientIds, selectPrevious );
				},
				blocksToPromptFor,
			} );
		} else {
			removeBlocks( clientIds, selectPrevious );
		}
	};
}

export function BlockRemovalWarningModal() {
	const { removalFunction, blocksToPromptFor } = useSelect( ( select ) =>
		select( blockEditorStore ).isRemovalPromptDisplayed()
	);

	const { displayRemovalPrompt } = useDispatch( blockEditorStore );

	const { getBlockType } = useSelect( blocksStore );

	if ( ! blocksToPromptFor ) {
		return;
	}

	const blockTitles = blocksToPromptFor
		.map( ( block ) => {
			return getBlockType( block ).title;
		} )
		.join( ', ' );

	const blockMessages = blocksToPromptFor.map( ( block ) => {
		return blockTypePromptMessages[ block ];
	} );

	const dedupedBlockMessages = [ ...new Set( blockMessages ) ].join( ' ' );

	const closeModal = () => displayRemovalPrompt( false );

	const onConfirmRemoval = () => {
		removalFunction();
		closeModal();
	};
	return (
		<Modal
			title={ sprintf(
				/* translators: %s: the name of a menu to delete */
				__( 'Remove %s?' ),
				blockTitles
			) }
			onRequestClose={ () => closeModal() }
		>
			<p>{ dedupedBlockMessages }</p>
			<HStack justify="right">
				<Button variant="tertiary" onClick={ closeModal }>
					{ __( 'Cancel' ) }
				</Button>
				<Button variant="primary" onClick={ onConfirmRemoval }>
					{ __( 'Confirm' ) }
				</Button>
			</HStack>
		</Modal>
	);
}
