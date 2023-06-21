/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

export const blockTypePromptMessages = {
	'core/query': __( 'Query Loop displays a list of posts.' ),
	'core/post-content': __(
		'Post Content displays the content of a post or page.'
	),
};

export function BlockRemovalWarningModal() {
	const { clientIds, selectPrevious, blockNamesForPrompt } = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).isRemovalPromptDisplayed()
	);

	const {
		displayRemovalPrompt,
		setRemovalPromptStatus,
		privateRemoveBlocks,
	} = unlock( useDispatch( blockEditorStore ) );

	// Signalling the removal prompt is in place.
	useEffect( () => {
		setRemovalPromptStatus( true );
		return () => {
			setRemovalPromptStatus( false );
		};
	}, [ setRemovalPromptStatus ] );

	if ( ! blockNamesForPrompt ) {
		return;
	}

	const closeModal = () => displayRemovalPrompt( false );

	const onConfirmRemoval = () => {
		privateRemoveBlocks( clientIds, selectPrevious, /* force */ true );
		closeModal();
	};

	return (
		<Modal
			title={ _n(
				'Really delete this block?',
				'Really delete these blocks?',
				clientIds.length
			) }
			onRequestClose={ closeModal }
		>
			{ blockNamesForPrompt.length === 1 ? (
				<p>{ blockTypePromptMessages[ blockNamesForPrompt[ 0 ] ] }</p>
			) : (
				<ul style={ { listStyleType: 'disc', paddingLeft: '1rem' } }>
					{ blockNamesForPrompt.map( ( name ) => (
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
					blockNamesForPrompt.length
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
