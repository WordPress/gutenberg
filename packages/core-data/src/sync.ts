/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { getWebRTCSyncProvider } from '@wordpress/sync';
import type { SyncProvider } from '@wordpress/sync';

declare global {
	interface Window {
		__experimentalEnableSync?: boolean;
	}
}

let syncProvider: SyncProvider | null = null;

/**
 * Returns the current sync provider, filterable by external code.
 *
 * If no sync provider is set, it returns a fallback no-op sync provider to
 * remove the need for defensive checks in the code that uses it.
 *
 * @return The current sync provider.
 */
export function getSyncProvider(): SyncProvider {
	if ( syncProvider ) {
		return syncProvider;
	}

	const fallbackNoOpSyncProvider = {
		__fallback: true,
		bootstrap: async () => {},
		discard: async () => {},
		register: () => {},
		update: () => {},
	};

	syncProvider = applyFilters(
		'core.getSyncProvider',
		null
	) as SyncProvider | null;

	// If the filter does not produce a provider and the experimental flag is set,
	// get the WebRTC sync provider.
	if ( ! syncProvider && window.__experimentalEnableSync ) {
		syncProvider = getWebRTCSyncProvider();
	}

	// If no sync provider is set, use the fallback no-op sync provider.
	if ( ! syncProvider ) {
		syncProvider = fallbackNoOpSyncProvider;
	}

	return syncProvider;
}
