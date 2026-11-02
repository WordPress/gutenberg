import { dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Context } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import type { Scope } from './types';

/*
 * Adds the entity registered below to the core-data record map, so
 * `useEntityRecords( 'root', 'guidelineScope' )` returns `Scope` records.
 */
declare module '@wordpress/core-data' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- merged declarations must repeat the type parameter.
	interface RootEntityRecordTypes< C extends Context > {
		guidelineScope: Scope;
	}
	interface RootEntityContexts {
		guidelineScope: 'view';
	}
}

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
