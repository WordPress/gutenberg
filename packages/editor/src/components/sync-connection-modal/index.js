/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';
import { store as coreDataStore } from '@wordpress/core-data';
import {
	store as blockEditorStore,
	BlockCanvasCover,
} from '@wordpress/block-editor';
import {
	Button,
	Modal,
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { error as errorIcon } from '@wordpress/icons';
import { getConnectionStatusMessage } from '@wordpress/sync';

/**
 * Sync connection modal that displays when any entity reports a disconnection.
 * Uses BlockCanvasCover.Fill to render in the block canvas.
 *
 * @return {Element|null} The modal component or null if no error.
 */
export function SyncConnectionModal() {
	const { connectionState, content } = useSelect( ( select ) => {
		const blocks = select( blockEditorStore ).getBlocks();
		const serializedContent = serialize( blocks );

		// Get the first disconnected sync connection state from core-data.
		const disconnectedState =
			select( coreDataStore ).getDisconnectedSyncConnectionState();

		return {
			connectionState: disconnectedState || null,
			content: serializedContent,
		};
	}, [] );

	const copyButtonRef = useCopyToClipboard( content ?? '' );

	if ( ! connectionState ) {
		return null;
	}

	const { title, description } =
		getConnectionStatusMessage( connectionState );

	return (
		<BlockCanvasCover.Fill>
			<Modal
				__experimentalHideHeader
				icon={ errorIcon }
				isDismissible={ false }
				isFullScreen={ false }
				onRequestClose={ () => {} }
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
			>
				<div className="editor-sync-connection-modal__container">
					<VStack alignment="center" justify="center" spacing={ 2 }>
						<Icon fill="#ccc" icon={ errorIcon } size={ 64 } />
						<h1>{ title }</h1>
						<p className="editor-sync-connection-modal__description">
							{ description }
						</p>
						<HStack spacing={ 2 } justify="center">
							<Button
								__next40pxDefaultSize
								ref={ copyButtonRef }
								variant="primary"
							>
								{ __( 'Copy post content' ) }
							</Button>
							<Button
								__next40pxDefaultSize
								href="edit.php"
								isDestructive
								variant="secondary"
							>
								{ __( 'Edit another post' ) }
							</Button>
						</HStack>
					</VStack>
				</div>
			</Modal>
		</BlockCanvasCover.Fill>
	);
}
