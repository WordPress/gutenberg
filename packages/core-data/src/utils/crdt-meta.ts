/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { type Type } from '../entity-types';

const metaDecisionCache: Map< string, Map< string, boolean > > = new Map();

/**
 * Given a meta key and post type definition, return a decision on whether to
 * sync the meta property.
 *
 * @param {string} metaKey  The meta key.
 * @param {Type}   postType The post type definition.
 * @return {boolean} Whether to sync the meta property.
 */
export function shouldSyncMetaForPostType(
	metaKey: string,
	postType: Type
): boolean {
	if ( ! metaDecisionCache.has( postType.slug ) ) {
		metaDecisionCache.set( postType.slug, new Map() );
	}

	const decisionMap = metaDecisionCache.get( postType.slug )!;

	if ( decisionMap.has( metaKey ) ) {
		return decisionMap.get( metaKey )!;
	}

	/**
	 * In order to be available to the sync module, meta properties must be
	 * registered against the post type and made available via the REST API
	 * (`'show_in_rest' => true`).
	 *
	 * Of the registered meta properties, by default we do not sync "hidden" meta
	 * fields (leading underscore in the meta key). This filter allows third-party
	 * code to override that behavior.
	 *
	 * @param {boolean} shouldSync   Whether to sync the meta property.
	 * @param {string}  metaKey      Meta key.
	 * @param {string}  postTypeSlug The post type slug.
	 * @param {Type}    postType     The post type definition.
	 * @return {boolean} Whether to sync this meta property to sync.
	 */
	const shouldSync = Boolean(
		applyFilters(
			'sync.shouldSyncMeta',
			! metaKey.startsWith( '_' ),
			metaKey,
			postType.slug,
			postType
		)
	);

	decisionMap.set( metaKey, shouldSync );

	return shouldSync;
}
