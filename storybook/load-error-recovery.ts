const PRELOAD_ERROR_RELOAD_ATTEMPT_KEY =
	'storybook-preload-error-reload-attempt';

export const PRELOAD_ERROR_RELOAD_GUARD_INTERVAL = 60_000;

type PreloadErrorRecoveryOptions = {
	now?: number;
	reload?: () => void;
	storage?: Pick< Storage, 'getItem' | 'setItem' >;
};

export function handlePreloadError(
	event: Pick< Event, 'preventDefault' >,
	{
		now = Date.now(),
		reload = () => window.top?.location.reload(),
		storage = window.sessionStorage,
	}: PreloadErrorRecoveryOptions = {}
) {
	let lastReloadAttempt;
	try {
		const storedReloadAttempt = storage.getItem(
			PRELOAD_ERROR_RELOAD_ATTEMPT_KEY
		);
		lastReloadAttempt =
			storedReloadAttempt === null ? null : Number( storedReloadAttempt );
	} catch {
		return;
	}

	if (
		lastReloadAttempt !== null &&
		Number.isFinite( lastReloadAttempt ) &&
		now - lastReloadAttempt < PRELOAD_ERROR_RELOAD_GUARD_INTERVAL
	) {
		return;
	}

	try {
		storage.setItem( PRELOAD_ERROR_RELOAD_ATTEMPT_KEY, String( now ) );
	} catch {
		return;
	}

	event.preventDefault();
	reload();
}
