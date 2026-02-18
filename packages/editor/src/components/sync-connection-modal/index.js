/**
 * WordPress dependencies
 */
import { useSelect, select } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';
import { store as coreDataStore } from '@wordpress/core-data';
import {
	privateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Button,
	Modal,
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { error as errorIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getSyncErrorMessages } from '../../utils/sync-error-messages';
import { unlock } from '../../lock-unlock';

const { BlockCanvasCover } = unlock( privateApis );

// Debounce time for initial disconnected status to allow connection to establish.
const INITIAL_DISCONNECTED_DEBOUNCE_MS = 5000;

/**
 * Sync connection modal that displays when any entity reports a disconnection.
 * Uses BlockCanvasCover.Fill to render in the block canvas.
 *
 * @return {Element|null} The modal component or null if not disconnected.
 */
export function SyncConnectionModal() {
	const connectionState = useSelect( ( selectFn ) => {
		return selectFn( coreDataStore ).getSyncConnectionStatus() || null;
	}, [] );

	const copyButtonRef = useCopyToClipboard( () => {
		const blocks = select( blockEditorStore ).getBlocks();
		return serialize( blocks );
	} );
	const [ syncConnectionMessage, setSyncConnectionMessage ] =
		useState( null );
	const debounceTimerRef = useRef( null );
	// Track whether we've passed the initial load phase.
	// Once true, disconnected status will show immediately without debounce.
	const hasInitializedRef = useRef( false );

	useEffect( () => {
		const status = connectionState?.status;

		// Clear any pending debounce timer when status changes.
		if ( debounceTimerRef.current ) {
			clearTimeout( debounceTimerRef.current );
			debounceTimerRef.current = null;
		}

		if ( status === 'connected' ) {
			hasInitializedRef.current = true;
			setSyncConnectionMessage( null );
		} else if ( status === 'disconnected' ) {
			const showModal = () => {
				hasInitializedRef.current = true;
				setSyncConnectionMessage(
					getSyncErrorMessages( connectionState.error ?? {} )
				);
			};

			// Debounce only on first load to allow connection to establish.
			if ( hasInitializedRef.current ) {
				showModal();
			} else {
				debounceTimerRef.current = setTimeout(
					showModal,
					INITIAL_DISCONNECTED_DEBOUNCE_MS
				);
			}
		}

		return () => {
			if ( debounceTimerRef.current ) {
				clearTimeout( debounceTimerRef.current );
			}
		};
	}, [ connectionState ] );

	if ( ! syncConnectionMessage ) {
		return null;
	}

	const { title, description } = syncConnectionMessage;

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
