/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

let registered = false;

/**
 * Registers the read-only guideline scopes registry as a core-data `root`
 * entity so the Settings page can consume it with `useEntityRecords`, the same
 * way it consumes post statuses. Idempotent.
 */
export function registerGuidelineScopeEntity(): void {
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
	] );
}
