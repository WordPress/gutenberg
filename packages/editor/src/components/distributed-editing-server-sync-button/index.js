/**
 * WordPress dependencies
 */
import { Button, Path, SVG } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, cloud } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES } from '../../store/distributed-editing';

const DEFAULT_SERVER_SYNC_POLL_INTERVAL_MS = 5000;
const CLOUD_OUTLINE_PATH =
	'M16.8 15.2h-9c-1.2 0-2.2-1.1-2.2-2.3s1-2.4 2.2-2.4h1.3l.3-1.1c.4-1.3 1.7-2.2 3.2-2.2 1.8 0 3.3 1.3 3.3 2.9v1.3l1.3.2c.8.1 1.4.9 1.4 1.8-.1 1-.9 1.8-1.8 1.8z';

function getServerSyncPollIntervalMilliseconds( value ) {
	const parsedValue = Number( value );

	if ( ! Number.isFinite( parsedValue ) || parsedValue <= 0 ) {
		return DEFAULT_SERVER_SYNC_POLL_INTERVAL_MS;
	}

	return Math.round( parsedValue );
}

function AnimatedCloudIcon( { cycleKey, intervalMilliseconds } ) {
	return (
		<span
			className="editor-distributed-editing-server-sync-button__icon"
			data-distributed-editing-server-sync-animation-cycle={ cycleKey }
			style={ {
				'--wp-de-rtc-server-sync-poll-interval-ms': `${ intervalMilliseconds }ms`,
			} }
		>
			<Icon icon={ cloud } />
			<SVG
				className="editor-distributed-editing-server-sync-button__icon-trace"
				focusable="false"
				aria-hidden="true"
				viewBox="0 0 24 24"
			>
				<Path d={ CLOUD_OUTLINE_PATH } />
			</SVG>
		</span>
	);
}

export default function DistributedEditingServerSyncButton() {
	const [ isSyncing, setIsSyncing ] = useState( false );
	const [ syncCycle, setSyncCycle ] = useState( 0 );
	const isMountedRef = useRef( false );
	const isSyncingRef = useRef( false );
	const timeoutRef = useRef();
	const { __experimentalSyncDistributedEditingWithServer } =
		useDispatch( editorStore );
	const {
		isDistributedEditingEnabled,
		isDistributedEditingSaveInFlight,
		isSaving,
		postId,
		syncPollingIntervalMilliseconds = DEFAULT_SERVER_SYNC_POLL_INTERVAL_MS,
	} = useSelect( ( select ) => {
		const editor = select( editorStore );
		const settings = editor.getEditorSettings?.()?.distributedEditing || {};
		const serverSyncPollingRuntime =
			settings.serverSyncPollingRuntime || {};
		const sessionState = editor.getDistributedEditingSessionState?.() || {};

		return {
			isDistributedEditingEnabled: Boolean(
				settings.enabled &&
					settings.automergeRawPostContentSave !== false
			),
			isDistributedEditingSaveInFlight: Boolean(
				sessionState.saveButtonClickInFlight ||
					sessionState.retrySaveStatus ===
						DISTRIBUTED_EDITING_RETRY_SAVE_STATUSES.SAVING
			),
			isSaving: Boolean(
				editor.isSavingPost?.() || editor.isAutosavingPost?.()
			),
			postId: editor.getCurrentPostId?.(),
			syncPollingIntervalMilliseconds:
				serverSyncPollingRuntime.selectedPollingIntervalMilliseconds,
		};
	}, [] );

	const normalizedSyncPollingIntervalMilliseconds =
		getServerSyncPollIntervalMilliseconds(
			syncPollingIntervalMilliseconds
		);

	useEffect( () => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
			globalThis.clearTimeout( timeoutRef.current );
		};
	}, [] );

	const runServerSync = useCallback( async () => {
		if ( isSyncingRef.current ) {
			return;
		}

		isSyncingRef.current = true;
		setIsSyncing( true );

		try {
			await __experimentalSyncDistributedEditingWithServer?.();
		} finally {
			isSyncingRef.current = false;

			if ( isMountedRef.current ) {
				setIsSyncing( false );
				setSyncCycle( ( currentCycle ) => currentCycle + 1 );
			}
		}
	}, [ __experimentalSyncDistributedEditingWithServer ] );

	useEffect( () => {
		globalThis.clearTimeout( timeoutRef.current );

		if (
			! isDistributedEditingEnabled ||
			! postId ||
			isSaving ||
			isDistributedEditingSaveInFlight ||
			isSyncing
		) {
			return;
		}

		timeoutRef.current = globalThis.setTimeout( () => {
			timeoutRef.current = undefined;
			runServerSync();
		}, normalizedSyncPollingIntervalMilliseconds );

		return () => {
			globalThis.clearTimeout( timeoutRef.current );
		};
	}, [
		isDistributedEditingEnabled,
		isDistributedEditingSaveInFlight,
		isSaving,
		isSyncing,
		normalizedSyncPollingIntervalMilliseconds,
		postId,
		runServerSync,
		syncCycle,
	] );

	if ( ! isDistributedEditingEnabled || ! postId ) {
		return null;
	}

	const isDisabled =
		isSaving || isDistributedEditingSaveInFlight || isSyncing;

	return (
		<Button
			data-distributed-editing-server-sync-button
			data-distributed-editing-server-sync-status={
				isSyncing ? 'syncing' : 'ready'
			}
			data-distributed-editing-server-sync-polling="true"
			data-distributed-editing-server-sync-poll-interval-ms={
				normalizedSyncPollingIntervalMilliseconds
			}
			aria-disabled={ isDisabled }
			accessibleWhenDisabled
			disabled={ isDisabled }
			icon={
				<AnimatedCloudIcon
					cycleKey={ syncCycle }
					intervalMilliseconds={
						normalizedSyncPollingIntervalMilliseconds
					}
				/>
			}
			label={ __( 'Sync with WordPress' ) }
			onClick={ async () => {
				if ( isDisabled ) {
					return;
				}

				globalThis.clearTimeout( timeoutRef.current );
				await runServerSync();
			} }
			size="compact"
			title={ __( 'Sync with WordPress' ) }
			variant="secondary"
		>
			{ __( 'Sync' ) }
		</Button>
	);
}
