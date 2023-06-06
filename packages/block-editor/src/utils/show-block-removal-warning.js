/**
 * WordPress dependencies
 */
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

const blockTypePromptMessages = {
	'core/query': __( 'Query Loop displays a list of posts.' ),

	'core/post-content': __(
		'Post Content displays the content of a post or page.'
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
			if ( blockTypePromptMessages[ blockName ] ) {
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

	const blockTypes = [ ...new Set( blocksToPromptFor.map( getBlockType ) ) ];

	const closeModal = () => displayRemovalPrompt( false );

	const onConfirmRemoval = () => {
		removalFunction();
		closeModal();
	};

	return (
		<Modal
			title={ _n(
				'Really delete this block?',
				'Really delete these blocks?',
				blocksToPromptFor.length
			) }
			onRequestClose={ closeModal }
		>
			{ blockTypes.length === 1 ? (
				<p>{ blockTypePromptMessages[ blockTypes[ 0 ].name ] }</p>
			) : (
				<ul style={ { listStyleType: 'disc', paddingLeft: '1rem' } }>
					{ blockTypes.map( ( { name } ) => (
						<li key={ name }>
							{ blockTypePromptMessages[ name ] }
						</li>
					) ) }
				</ul>
			) }
			<p>
				{ _n(
					'Removing this block is not advised.',
					'Removing these blocks is not advised.',
					blockTypes.length
				) }
			</p>
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
