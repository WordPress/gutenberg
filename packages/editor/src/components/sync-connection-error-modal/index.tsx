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
	type ConnectionError,
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

interface SyncConnectionErrorModalProps {
	description: string; // Modal description.
	error?: ConnectionError; // Error object with a `code` property.
	manualRetry?: () => void; // Callback for when the retry button is clicked.
	postType?: { slug?: string; labels?: { name?: string } } | null; // Current post type object.
	secondsRemainingUntilAutoRetry?: number; // Seconds remaining until the next automatic retry attempt, if applicable.
	title: string; // Modal title.
}

/**
 * Default sync connection modal component.
 *
 * @param props - SyncConnectionErrorModalProps.
 */
function DefaultSyncConnectionErrorModal(
	props: SyncConnectionErrorModalProps
) {
	const {
		description,
		manualRetry,
		postType,
		secondsRemainingUntilAutoRetry,
		title,
	} = props;

	const copyButtonRef = useCopyToClipboard( () => {
		const blocks = select( blockEditorStore ).getBlocks();
		return serialize( blocks );
	} );

	let retryCountdownText: string = '';
	let isRetrying = false;
	if (
		secondsRemainingUntilAutoRetry &&
		secondsRemainingUntilAutoRetry > 0
	) {
		retryCountdownText = sprintf(
			/* translators: %d: number of seconds until retry */
			_n(
				'Retrying connection in %d second\u2026',
				'Retrying connection in %d seconds\u2026',
				secondsRemainingUntilAutoRetry
			),
			secondsRemainingUntilAutoRetry
		);
	} else if ( 0 === secondsRemainingUntilAutoRetry ) {
		isRetrying = true;
		retryCountdownText = __( 'Retrying\u2026' );
	}

	let editPostHref = 'edit.php';
	if ( postType?.slug ) {
		editPostHref = `edit.php?post_type=${ postType.slug }`;
	}

	return (
		<Modal
			overlayClassName="editor-sync-connection-error-modal"
			isDismissible={ false }
			onRequestClose={ () => {} }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			size="medium"
			title={ title }
		>
			<VStack spacing={ 6 }>
				<p>{ description }</p>
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
	);
}

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

	// Set hasInitialized after a debounce to give extra time on initial load.
	useEffect( () => {
		const timeout = setTimeout( () => {
			setHasInitialized( true );
		}, INITIAL_DISCONNECTED_DEBOUNCE_MS );

		return () => clearTimeout( timeout );
	}, [] );

	// Show the modal once the retry schedule is exhausted. Hide it on reconnect.
	// This naturally fires only after a failed retry (status = 'disconnected'),
	// not mid-cycle (status = 'connecting').
	useEffect( () => {
		if ( 'connected' === connectionStatus?.status ) {
			setShowModal( false );
			return;
		}

		if (
			connectionStatus?.status === 'disconnected' &&
			connectionStatus.backgroundRetriesFailed
		) {
			setShowModal( true );
		}
	}, [ connectionStatus ] );

	if ( ! isCollaborationEnabled || ! hasInitialized || ! showModal ) {
		return null;
	}

	const error =
		connectionStatus && 'error' in connectionStatus
			? connectionStatus?.error
			: undefined;

	/**
	 * Allow plugins to handle the sync connection error themselves.
	 * If a plugin returns a non-null value, it signals that it has taken
	 * over error display and the default modal is suppressed.
	 *
	 * @example
	 * ```js
	 * wp.hooks.addFilter(
	 *     'editor.SyncConnectionError',
	 *     'my-plugin/handle-sync-error',
	 *     ( override, errorCode ) => {
	 *         if ( errorCode === 'connection-limit-exceeded' ) {
	 *             return true; // Plugin handles this error via its own UI.
	 *         }
	 *         return override;
	 *     }
	 * );
	 * ```
	 */
	const isSyncErrorHandledByPlugin =
		applyFilters( 'editor.SyncConnectionError', null, error?.code ) !==
		null;

	if ( isSyncErrorHandledByPlugin ) {
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

	return (
		<BlockCanvasCover.Fill>
			<DefaultSyncConnectionErrorModal
				description={ messages.description }
				error={ error }
				manualRetry={ manualRetry }
				postType={ postType }
				secondsRemainingUntilAutoRetry={ secondsRemaining }
				title={ messages.title }
			/>
		</BlockCanvasCover.Fill>
	);
}
