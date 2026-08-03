/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

let registered = false;

/**
 * Registers the core-data `root` entities the Settings page consumes with
 * `useEntityRecords`, the same way it consumes post statuses. Idempotent.
 *
 * - `guidelineScope`: the read-only guideline scopes registry.
 * - `blockType`: the registered block types, read from the core
 *   `/wp/v2/block-types` endpoint. The page reads this instead of loading
 *   `@wordpress/block-library` just to enumerate blocks that can carry
 *   guidelines.
 */
export function registerGuidelineEntities(): void {
	if ( registered ) {
		return;
	}
	registered = true;

	dispatch( coreStore ).addEntities( [
		{
			label: __( 'Guideline Scope' ),
			name: 'guidelineScope',
			kind: 'root',
			baseURL: '/wp/v2/knowledge/guideline-scopes',
			plural: 'guidelineScopes',
			key: 'slug',
			supportsPagination: false,
		},
		{
			label: __( 'Block Type' ),
			name: 'blockType',
			kind: 'root',
			baseURL: '/wp/v2/block-types',
			plural: 'blockTypes',
			key: 'name',
			supportsPagination: false,
		},
	] );
}
