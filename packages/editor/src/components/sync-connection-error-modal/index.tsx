/**
 * WordPress dependencies
 */
import { useSelect, select } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
// @ts-ignore No exported types.
import { serialize } from '@wordpress/blocks';
import {
	store as coreDataStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { privateApis, store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { useState, useEffect } from '@wordpress/element';
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
const INITIAL_DISCONNECTED_DEBOUNCE_MS = 20000;

/**
 * Sync connection modal that displays when any entity reports a disconnection.
 * Uses BlockCanvasCover.Fill to render in the block canvas.
 *
 * @return The modal component or null if not disconnected.
 */
export function SyncConnectionErrorModal() {
	const [ hasInitialized, setHasInitialized ] = useState( false );
	const [ showModal, setShowModal ] = useState( false );

	const { connectionStatus, isCollaborationEnabled, postType } = useSelect(
		( selectFn ) => {
			const currentPostType =
				selectFn( editorStore ).getCurrentPostType();
			return {
				connectionStatus:
					selectFn( coreDataStore ).getSyncConnectionStatus() || null,
				isCollaborationEnabled:
					selectFn(
						editorStore
					).isCollaborationEnabledForCurrentPost(),
				postType: currentPostType
					? selectFn( coreDataStore ).getPostType( currentPostType )
					: null,
			};
		},
		[]
	);

	const { onManualRetry, secondsRemaining } =
		useRetryCountdown( connectionStatus );

	const copyButtonRef = useCopyToClipboard( () => {
		const blocks = select( blockEditorStore ).getBlocks();
		return serialize( blocks );
	} );

	// Set hasInitialized after a debounce to give extra time on initial load.
	useEffect( () => {
		const timeout = setTimeout( () => {
			setHasInitialized( true );
		}, INITIAL_DISCONNECTED_DEBOUNCE_MS );

		return () => clearTimeout( timeout );
	}, [] );

	// Show the modal when disconnected and either retries are exhausted or
	// no retry is available (unrecoverable error). Hide on reconnect.
	// The 'connecting' state is ignored so the modal preserves its current
	// visibility during active retry attempts.
	const canRetry =
		connectionStatus &&
		'disconnected' === connectionStatus.status &&
		( connectionStatus.canManuallyRetry ||
			connectionStatus.willAutoRetryInMs );

	useEffect( () => {
		if ( 'connected' === connectionStatus?.status ) {
			setShowModal( false );
			return;
		}

		if (
			connectionStatus?.status &&
			'connecting' !== connectionStatus.status &&
			( ! canRetry || connectionStatus.backgroundRetriesFailed )
		) {
			setShowModal( true );
		}
	}, [ connectionStatus, canRetry ] );

	if ( ! isCollaborationEnabled || ! hasInitialized || ! showModal ) {
		return null;
	}

	const error =
		connectionStatus && 'error' in connectionStatus
			? connectionStatus?.error
			: undefined;

	// For unrecoverable errors (no retry available), allow plugins to handle
	// the error themselves. If a plugin returns a value other than false, it
	// signals that it has taken over error display and the default modal is
	// suppressed.
	//
	// @example
	// ```js
	// wp.hooks.addFilter(
	//     'editor.isSyncConnectionErrorHandled',
	//     'my-plugin/handle-sync-error',
	//     ( isHandled, errorCode ) => {
	//         if ( errorCode === 'connection-limit-exceeded' ) {
	//             return true; // Plugin handles this error via its own UI.
	//         }
	//         return isHandled;
	//     }
	// );
	// ```
	if (
		! canRetry &&
		applyFilters(
			'editor.isSyncConnectionErrorHandled',
			false,
			error?.code
		) !== false
	) {
		return null;
	}

	const manualRetry =
		connectionStatus &&
		'canManuallyRetry' in connectionStatus &&
		connectionStatus.canManuallyRetry
			? () => {
					onManualRetry();
					retrySyncConnection();
			  }
			: undefined;

	const messages = getSyncErrorMessages( error );

	let retryCountdownText: string = '';
	let isRetrying = false;
	if ( secondsRemaining && secondsRemaining > 0 ) {
		retryCountdownText = sprintf(
			/* translators: %d: number of seconds until retry */
			_n(
				'Retrying connection in %d second\u2026',
				'Retrying connection in %d seconds\u2026',
				secondsRemaining
			),
			secondsRemaining
		);
	} else if ( 0 === secondsRemaining ) {
		isRetrying = true;
		retryCountdownText = __( 'Retrying\u2026' );
	}

	let editPostHref = 'edit.php';
	if ( postType?.slug ) {
		editPostHref = `edit.php?post_type=${ postType.slug }`;
	}

	return (
		<BlockCanvasCover.Fill>
			<Modal
				overlayClassName="editor-sync-connection-error-modal"
				isDismissible={ false }
				onRequestClose={ () => {} }
				shouldCloseOnClickOutside={ false }
				shouldCloseOnEsc={ false }
				size="medium"
				title={ messages.title }
			>
				<VStack spacing={ 6 }>
					<p>{ messages.description }</p>
					{ retryCountdownText && (
						<p className="editor-sync-connection-error-modal__retry-countdown">
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
							variant={ manualRetry ? 'secondary' : 'primary' }
						>
							{ __( 'Copy Post Content' ) }
						</Button>
						{ manualRetry && (
							<Button
								__next40pxDefaultSize
								accessibleWhenDisabled
								aria-disabled={ isRetrying }
								disabled={ isRetrying }
								isBusy={ isRetrying }
								variant="primary"
								onClick={ manualRetry }
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
