const INITIAL_DISCONNECTED_DEBOUNCE_MS = 5000;
	const [ isManualRetryAvailable, setIsManualRetryAvailable ] =
		useState( false );

	// Track retry availability separately from the raw connection status.
	// The polling manager briefly emits `{ status: 'connecting' }` without
	// `canManuallyRetry` when a retry is kicked off, which would otherwise
	//  unmount the Retry button briefly.
	useEffect( () => {
		if ( 'connecting' === connectionStatus?.status ) {
			return;
		}

		setIsManualRetryAvailable(
			connectionStatus !== null &&
				'canManuallyRetry' in connectionStatus &&
				connectionStatus.canManuallyRetry === true
		);
	}, [ connectionStatus ] );
	// Show the modal once the retry schedule is exhausted. Hide it on reconnect.
	// This naturally fires only after a failed retry (status = 'disconnected'),
	// not mid-cycle (status = 'connecting').
		if ( isConnected ) {
		const timeout = setTimeout( () => {
			connectionStatus?.status === 'disconnected' &&
			connectionStatus.backgroundRetriesFailed
		}, DISCONNECTED_DEBOUNCE_MS );
	}, [ connectionStatus ] );
	const manualRetry = () => {
		onManualRetry();
		retrySyncConnection();
	};
			<FilteredSyncConnectionErrorModal
				description={ messages.description }
				error={ error }
				manualRetry={ manualRetry }
				postType={ postType }
				secondsRemainingUntilAutoRetry={ secondsRemaining }
			/>
