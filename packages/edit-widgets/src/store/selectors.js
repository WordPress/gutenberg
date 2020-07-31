/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { KIND, WIDGET_AREA_ENTITY_TYPE, buildWidgetAreasQuery } from './utils';

/**
 * Returns a "stub" sidebar post reflecting the contents of a sidebar with id=sidebarId. The
 * post is meant as a convenient to only exists in runtime and should never be saved. It
 * enables a convenient way of editing the navigation by using a regular post editor.
 *
 * @param {number} menuId The id sidebar menu to create a post from.
 * @return {null|Object} Post once the resolver fetches it, otherwise null
 */
export const getWidgetAreas = createRegistrySelector( ( select ) => () => {
	if ( ! hasResolvedWidgetAreas() ) {
		return null;
	}

	const query = buildWidgetAreasQuery();
	return select( 'core' )
		.getEntityRecords( KIND, WIDGET_AREA_ENTITY_TYPE, query )
		.filter( ( { id } ) => id !== 'wp_inactive_widgets' );
} );

export const getEditedWidgetAreas = createRegistrySelector(
	( select ) => ( state, ids ) => {
		let widgetAreas = select( 'core/edit-widgets' ).getWidgetAreas();
		if ( ! widgetAreas ) {
			return [];
		}
		if ( ids ) {
			widgetAreas = widgetAreas.filter( ( { id } ) =>
				ids.includes( id )
			);
		}
		return widgetAreas.filter( ( { id } ) =>
			select( 'core' ).hasEditsForEntityRecord(
				KIND,
				WIDGET_AREA_ENTITY_TYPE,
				id
			)
		);
	}
);

export const isSavingWidgetAreas = createRegistrySelector(
	( select ) => ( state, ids ) => {
		if ( ! ids ) {
			ids = select( 'core/edit-widgets' )
				.getWidgetAreas()
				?.map( ( { id } ) => id );
		}
		for ( const id in ids ) {
			const isSaving = select( 'core' ).isSavingEntityRecord(
				KIND,
				WIDGET_AREA_ENTITY_TYPE,
				id
			);
			if ( isSaving ) {
				return true;
			}
		}
		return false;
	}
);

/**
 * Returns true if the navigation post related to menuId was already resolved.
 *
 * @param {number} menuId The id of menu.
 * @return {boolean} True if the navigation post related to menuId was already resolved, false otherwise.
 */
export const hasResolvedWidgetAreas = createRegistrySelector(
	( select ) => () => {
		const query = buildWidgetAreasQuery();
		const resolutionFinished = select(
			'core'
		).hasFinishedResolution( 'getEntityRecords', [
			KIND,
			WIDGET_AREA_ENTITY_TYPE,
			query,
		] );
		if ( ! resolutionFinished ) {
			return false;
		}

		const areas = select( 'core' ).getEntityRecords(
			KIND,
			WIDGET_AREA_ENTITY_TYPE,
			query
		);
		const contentAssigned = ! areas.length || 'content' in areas[ 0 ];
		if ( ! contentAssigned ) {
			return false;
		}

		return true;
	}
);
