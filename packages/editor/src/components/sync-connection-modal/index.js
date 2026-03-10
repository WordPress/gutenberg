/**
 * WordPress dependencies
 */
import { useSelect, select } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import { serialize } from '@wordpress/blocks';
import {
	store as coreDataStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import {
	privateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSyncErrorMessages } from '../../utils/sync-error-messages';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useRetryCountdown } from './use-retry-countdown';

const { BlockCanvasCover } = unlock( privateApis );
const { retrySyncConnection } = unlock( coreDataPrivateApis );

// Debounce time for initial disconnected status to allow connection to establish.
const INITIAL_DISCONNECTED_DEBOUNCE_MS = 5000;
const noop = () => {};

/**
 * Sync connection modal that displays when any entity reports a disconnection.
 * Uses BlockCanvasCover.Fill to render in the block canvas.
 *
 * @return {Element|null} The modal component or null if not disconnected.
 */
export function SyncConnectionModal() {
	const { connectionState, postType } = useSelect( ( selectFn ) => {
		const currentPostType = selectFn( editorStore ).getCurrentPostType();
		return {
			connectionState:
				selectFn( coreDataStore ).getSyncConnectionStatus() || null,
			postType: currentPostType
				? selectFn( coreDataStore ).getPostType( currentPostType )
				: null,
		};
	}, [] );

	const { secondsRemaining, markRetrying } = useRetryCountdown(
		connectionState?.retryInMs,
		connectionState?.status
	);

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

	const connectionStatus = connectionState?.status;
	const connectionErrorCode = connectionState?.error?.code;

	useEffect( () => {
		// Clear any pending debounce timer when status changes.
		if ( debounceTimerRef.current ) {
			clearTimeout( debounceTimerRef.current );
			debounceTimerRef.current = null;
		}

		if ( connectionStatus === 'connected' ) {
			hasInitializedRef.current = true;
			setSyncConnectionMessage( null );
		} else if ( connectionStatus === 'disconnected' ) {
			const showModal = () => {
				hasInitializedRef.current = true;
				setSyncConnectionMessage(
					getSyncErrorMessages( { code: connectionErrorCode } )
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
	}, [ connectionStatus, connectionErrorCode ] );

	if ( ! syncConnectionMessage ) {
		return null;
	}

	const { title, description, canRetry } = syncConnectionMessage;

	let retryCountdownText;
	if ( secondsRemaining > 0 ) {
		retryCountdownText = sprintf(
			/* translators: %d: number of seconds until retry */
			_n(
				'Retrying connection in %d second\u2026',
				'Retrying connection in %d seconds\u2026',
				secondsRemaining
			),
			secondsRemaining
		);
	} else if ( secondsRemaining === 0 ) {
		retryCountdownText = __( 'Retrying\u2026' );
	}

	let editPostHref = 'edit.php';
	if ( postType?.slug ) {
		editPostHref = `edit.php?post_type=${ postType.slug }`;
	}

	const isRetrying = secondsRemaining === 0;

	return (
		<BlockCanvasCover.Fill>
			<Modal
				className="editor-sync-connection-modal"
				isDismissible={ false }
				onRequestClose={ noop }
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
				size="medium"
				title={ title }
			>
				<VStack spacing={ 6 }>
					<p>{ description }</p>
					{ retryCountdownText && (
						<p className="editor-sync-connection-modal__retry-countdown">
							{ retryCountdownText }
						</p>
					) }
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							href={ editPostHref }
							isDestructive
							variant="tertiary"
						>
							{ sprintf(
								/* translators: %s: Post type name (e.g., "Posts", "Pages"). */
								__( 'Back to %s' ),
								postType?.labels?.name ?? __( 'Posts' )
							) }
						</Button>
						<Button
							__next40pxDefaultSize
							ref={ copyButtonRef }
							variant={ canRetry ? 'secondary' : 'primary' }
						>
							{ __( 'Copy Post Content' ) }
						</Button>
						{ canRetry && (
							<Button
								__next40pxDefaultSize
								aria-disabled={ isRetrying }
								isBusy={ isRetrying }
								variant="primary"
								onClick={ () => {
									if ( isRetrying ) {
										return;
									}
									markRetrying();
									retrySyncConnection();
								} }
							>
								{ __( 'Retry' ) }
							</Button>
						) }
					</HStack>
				</VStack>
			</Modal>
		</BlockCanvasCover.Fill>
	);
}
