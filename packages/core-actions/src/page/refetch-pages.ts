import { store as coreStore } from '@wordpress/core-data';
import type { DataRegistry } from '@wordpress/data';

/**
 * Requests pages again, so their `action-*` REST links follow a change of the
 * site settings the links depend on, such as the homepage.
 *
 * The pages are requested through `getEntityRecords`, whose records replace
 * the ones in the store, so every list and editor showing them updates.
 *
 * @param registry The data registry.
 * @param ids      The ids of the pages. Unset ids, such as a `0` setting, are
 *                 skipped.
 * @return A promise resolving once the pages are stored.
 */
export async function refetchPages(
	registry: DataRegistry,
	ids: Array< number | string | undefined >
) {
	const include = [ ...new Set( ids.filter( Boolean ) ) ];
	if ( ! include.length ) {
		return;
	}
	const query = { include };
	registry
		.dispatch( coreStore )
		.invalidateResolution( 'getEntityRecords', [
			'postType',
			'page',
			query,
		] );
	await registry
		.resolveSelect( coreStore )
		.getEntityRecords( 'postType', 'page', query );
}
