/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * IMPORTANT: Ensure that we only import types from `@wordpress/sync` and not
 * code. The code is loaded only behind an experimental flag, which allows
 * other plugins to load their own sync provider.
 */
import type { SyncProvider } from '@wordpress/sync';

let syncProvider: SyncProvider;

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

	syncProvider =
		( applyFilters(
			'core.getSyncProvider',
			null
		) as SyncProvider | null ) ?? fallbackNoOpSyncProvider;

	return syncProvider;
}
