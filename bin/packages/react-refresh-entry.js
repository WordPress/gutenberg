/**
 * React Refresh Entry
 *
 * Injects the React Refresh runtime into the global hook for hot module replacement.
 */
import RefreshRuntime from 'react-refresh/runtime';

if ( ! globalThis.__reactRefreshInjected ) {
	RefreshRuntime.injectIntoGlobalHook( globalThis );
	globalThis.__reactRefreshInjected = true;
}
