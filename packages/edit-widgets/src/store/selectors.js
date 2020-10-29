/**
 * External dependencies
 */
import { invert, keyBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	buildWidgetsQuery,
	buildWidgetAreasQuery,
	buildWidgetAreaPostId,
	KIND,
	POST_TYPE,
	WIDGET_AREA_ENTITY_TYPE,
} from './utils';

export const getWidgets = createRegistrySelector( ( select ) => () => {
	const widgets = select( 'core' ).getEntityRecords(
		'root',
		'widget',
		buildWidgetsQuery()
	);

	return keyBy( widgets, 'id' );
} );

/**
 * Returns API widget data for a particular widget ID.
 *
 * @param  {number} id  Widget ID
 * @return {Object}     API widget data for a particular widget ID.
 */
export const getWidget = createRegistrySelector(
	( select ) => ( state, id ) => {
		const widgets = select( 'core/edit-widgets' ).getWidgets();
		return widgets[ id ];
	}
);

export const getWidgetAreas = createRegistrySelector( ( select ) => () => {
	const query = buildWidgetAreasQuery();
	return select( 'core' ).getEntityRecords(
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		query
	);
} );

export const getWidgetIdForClientId = ( state, clientId ) => {
	const widgetIdToClientId = state.mapping;
	const clientIdToWidgetId = invert( widgetIdToClientId );
	return clientIdToWidgetId[ clientId ];
};

/**
 * Returns widgetArea containing a block identify by given clientId
 *
 * @param {string} clientId The ID of the block.
 * @return {Object} Containing widget area.
 */
export const getWidgetAreaForClientId = createRegistrySelector(
	( select ) => ( state, clientId ) => {
		const widgetAreas = select( 'core/edit-widgets' ).getWidgetAreas();
		for ( const widgetArea of widgetAreas ) {
			const post = select( 'core' ).getEditedEntityRecord(
				KIND,
				POST_TYPE,
				buildWidgetAreaPostId( widgetArea.id )
			);
			const clientIds = post.blocks.map( ( block ) => block.clientId );
			if ( clientIds.includes( clientId ) ) {
				return widgetArea;
			}
		}
	}
);

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
		return widgetAreas
			.filter( ( { id } ) =>
				select( 'core' ).hasEditsForEntityRecord(
					KIND,
					POST_TYPE,
					buildWidgetAreaPostId( id )
				)
			)
			.map( ( { id } ) =>
				select( 'core' ).getEditedEntityRecord(
					KIND,
					WIDGET_AREA_ENTITY_TYPE,
					id
				)
			);
	}
);

/**
 * Returns all blocks representing reference widgets.
 *
 * @param  {string} referenceWidgetName  Optional. If given, only reference widgets with this name will be returned.
 * @return {Array}  List of all blocks representing reference widgets
 */
export const getReferenceWidgetBlocks = createRegistrySelector(
	( select ) => ( state, referenceWidgetName = null ) => {
		const results = [];
		const widgetAreas = select( 'core/edit-widgets' ).getWidgetAreas();
		for ( const _widgetArea of widgetAreas ) {
			const post = select( 'core' ).getEditedEntityRecord(
				KIND,
				POST_TYPE,
				buildWidgetAreaPostId( _widgetArea.id )
			);
			for ( const block of post.blocks ) {
				if (
					block.name === 'core/legacy-widget' &&
					( ! referenceWidgetName ||
						block.attributes?.referenceWidgetName ===
							referenceWidgetName )
				) {
					results.push( block );
				}
			}
		}
		return results;
	}
);

export const isSavingWidgetAreas = createRegistrySelector( ( select ) => () => {
	const widgetAreasIds = select( 'core/edit-widgets' )
		.getWidgetAreas()
		?.map( ( { id } ) => id );
	if ( ! widgetAreasIds ) {
		return false;
	}

	for ( const id of widgetAreasIds ) {
		const isSaving = select( 'core' ).isSavingEntityRecord(
			KIND,
			WIDGET_AREA_ENTITY_TYPE,
			id
		);
		if ( isSaving ) {
			return true;
		}
	}

	const widgetIds = [
		...Object.keys( select( 'core/edit-widgets' ).getWidgets() ),
		undefined, // account for new widgets without an ID
	];
	for ( const id of widgetIds ) {
		const isSaving = select( 'core' ).isSavingEntityRecord(
			'root',
			'widget',
			id
		);
		if ( isSaving ) {
			return true;
		}
	}

	return false;
} );

/**
 * Gets whether the widget area is opened.
 *
 * @param {Array}  state    The open state of the widget areas.
 * @param {string} clientId The clientId of the widget area.
 * @return {boolean}        True if the widget area is open.
 */
export const getIsWidgetAreaOpen = ( state, clientId ) => {
	const { widgetAreasOpenState } = state;
	return !! widgetAreasOpenState[ clientId ];
};

/**
 * Returns true if the inserter is opened.
 *
 * @param  {Object}  state Global application state.
 *
 * @return {boolean} Whether the inserter is opened.
 */
export function isInserterOpened( state ) {
	return state.isInserterOpened;
}
