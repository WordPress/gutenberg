/**
 * WordPress dependencies
 */
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

export const blockTypePromptMessages = {
	'core/query': __( 'Query Loop displays a list of posts.' ),
	'core/post-content': __(
		'Post Content displays the content of a post or page.'
	),
};

export function BlockRemovalWarningModal() {
	const { removalFunction, blocksToPromptFor: blockNames } = useSelect(
		( select ) => select( blockEditorStore ).isRemovalPromptDisplayed()
	);

	const { displayRemovalPrompt } = useDispatch( blockEditorStore );

	if ( ! blockNames ) {
		return;
	}

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
				blockNames.length
			) }
			onRequestClose={ closeModal }
		>
			{ blockNames.length === 1 ? (
				<p>{ blockTypePromptMessages[ blockNames[ 0 ] ] }</p>
			) : (
				<ul style={ { listStyleType: 'disc', paddingLeft: '1rem' } }>
					{ blockNames.map( ( name ) => (
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
					blockNames.length
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
