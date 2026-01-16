/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';
import {
	Button,
	Modal,
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { error as errorIcon } from '@wordpress/icons';
import {
	syncConnectionStore,
	getConnectionStatusMessage,
} from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Default modal displayed when a sync connection is lost or encounters an error.
 * Providers can override this by rendering their own modal in BlockCanvasCover.Fill.
 *
 * @return {Element|null} The modal component or null if no error.
 */
export function SyncConnectionModal() {
	const disconnectedConnection = useSelect( ( select ) => {
		return select( syncConnectionStore ).getDisconnectedConnection();
	}, [] );

	const content = useSelect( ( select ) => {
		const blocks = select( blockEditorStore ).getBlocks();
		return serialize( blocks );
	}, [] );

	const copyButtonRef = useCopyToClipboard( content ?? '' );

	if ( ! disconnectedConnection ) {
		return null;
	}

	const { metadata } = disconnectedConnection;
	const { title, description } = getConnectionStatusMessage( metadata );

	return (
		<Modal
			__experimentalHideHeader
			icon={ errorIcon }
			isDismissible={ false }
			isFullScreen={ false }
			onRequestClose={ () => {} }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
		>
			<div className="block-editor-sync-connection-modal__container">
				<VStack alignment="center" justify="center" spacing={ 2 }>
					<Icon fill="#ccc" icon={ errorIcon } size={ 64 } />
					<h1>{ title }</h1>
					<p className="block-editor-sync-connection-modal__description">
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
	);
}
