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
	withFilters,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
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
const INITIAL_DISCONNECTED_DEBOUNCE_MS = 5000;

// Debounce time for showing the disconnect dialog after the intial connection,
// allowing brief network interruptions to resolve.
const DISCONNECTED_DEBOUNCE_MS = 2000;

export interface SyncConnectionErrorModalProps {
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
 * Can be replaced or wrapped via the `editor.SyncConnectionErrorModal` filter.
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
 * Filtered version of the sync connection modal, allowing third-party
 * plugins to replace the default modal via:
 *
 * ```js
 * wp.hooks.addFilter(
 *     'editor.SyncConnectionErrorModal',
 *     'my-plugin/custom-sync-connection-error-modal',
 *     ( OriginalComponent ) => ( props ) => {
 *         // Return a custom component or wrap the original.
 *         return <OriginalComponent { ...props } />;
 *     }
 * );
 * ```
 */
// @ts-ignore
const FilteredSyncConnectionErrorModal = globalThis.IS_GUTENBERG_PLUGIN
	? withFilters( 'editor.SyncConnectionErrorModal' )(
			DefaultSyncConnectionErrorModal
	  )
	: DefaultSyncConnectionErrorModal;

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

	const isConnected = 'connected' === connectionStatus?.status;

	// Set hasInitialized after a debounce to give extra time on initial load.
	useEffect( () => {
		const timeout = setTimeout( () => {
			setHasInitialized( true );
		}, INITIAL_DISCONNECTED_DEBOUNCE_MS );

		return () => clearTimeout( timeout );
	}, [] );

	useEffect( () => {
		if ( isConnected ) {
			setShowModal( false );
			return;
		}

		const timeout = setTimeout( () => {
			setShowModal( true );
		}, DISCONNECTED_DEBOUNCE_MS );

		return () => clearTimeout( timeout );
	}, [ isConnected ] );

	if ( ! isCollaborationEnabled || ! hasInitialized || ! showModal ) {
		return null;
	}

	const error =
		connectionStatus && 'error' in connectionStatus
			? connectionStatus?.error
			: undefined;
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
			<FilteredSyncConnectionErrorModal
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
