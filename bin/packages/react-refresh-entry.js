/**
 * React Refresh Entry
 *
 * Injects the React Refresh runtime into the global hook for hot module replacement.
 * This file uses the ReactRefreshRuntime global provided by wp-react-refresh-runtime.
 */

/* global ReactRefreshRuntime */

if (
	typeof ReactRefreshRuntime !== 'undefined' &&
	! globalThis.__reactRefreshInjected
) {
	ReactRefreshRuntime.injectIntoGlobalHook( globalThis );
	globalThis.__reactRefreshInjected = true;
}
