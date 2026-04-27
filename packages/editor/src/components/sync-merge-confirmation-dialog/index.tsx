/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { Button, Modal } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { clearPendingServerCRDT, mergeFromPendingServerCRDT } =
	unlock( coreDataPrivateApis );

/**
 * Dialog shown when the user tries to save while editing disconnected and
 * the server-side CRDT has changes they haven't seen yet. Offers to merge
 * those changes first or overwrite them.
 */
export default function SyncMergeConfirmationDialog() {
	const hasPending = useSelect(
		( select ) =>
			unlock( select( editorStore ) ).hasPendingServerCRDTMerge(),
		[]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );
	const editorDispatch = useDispatch( editorStore );

	if ( ! hasPending ) {
		return null;
	}

	const dismiss = () => {
		clearPendingServerCRDT();
		unlock( editorDispatch ).setPendingServerCRDTMerge( false );
	};

	const handleMerge = () => {
		mergeFromPendingServerCRDT();
		unlock( editorDispatch ).setPendingServerCRDTMerge( false );

		createSuccessNotice(
			__( 'Server changes merged. Review and save when ready.' ),
			{ type: 'snackbar' }
		);
	};

	const handleOverwrite = () => {
		clearPendingServerCRDT();
		unlock( editorDispatch ).setPendingServerCRDTMerge( false );
		editorDispatch.savePost( { overwriteServerCRDT: true } );
	};

	return (
		<Modal
			title={ __( 'Merge server changes?' ) }
			onRequestClose={ dismiss }
			size="medium"
		>
			<Stack direction="column" gap="xl">
				<p>
					{ __(
						'Other changes have been saved to this document while you were disconnected. Would you like to merge them with your changes first?'
					) }
				</p>
				<Stack justify="flex-end" gap="sm">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						isDestructive
						onClick={ handleOverwrite }
					>
						{ __( 'Save without merging' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ handleMerge }
					>
						{ __( 'Merge changes' ) }
					</Button>
				</Stack>
			</Stack>
		</Modal>
	);
}
