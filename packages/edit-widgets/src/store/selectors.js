/**
 * External dependencies
 */
import { keyBy } from 'lodash';

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
import { STORE_NAME as editWidgetsStoreName } from './constants';

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
		const widgets = select( editWidgetsStoreName ).getWidgets();
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

/**
 * Returns widgetArea containing a block identify by given widgetId
 *
 * @param {string} widgetId The ID of the widget.
 * @return {Object} Containing widget area.
 */
export const getWidgetAreaForWidgetId = createRegistrySelector(
	( select ) => ( state, widgetId ) => {
		const widgetAreas = select( editWidgetsStoreName ).getWidgetAreas();
		return widgetAreas.find( ( widgetArea ) => {
			const post = select( 'core' ).getEditedEntityRecord(
				KIND,
				POST_TYPE,
				buildWidgetAreaPostId( widgetArea.id )
			);
			const blockWidgetIds = post.blocks.map(
				( block ) => block.attributes.__internalWidgetId
			);
			return blockWidgetIds.includes( widgetId );
		} );
	}
);

export const getEditedWidgetAreas = createRegistrySelector(
	( select ) => ( state, ids ) => {
		let widgetAreas = select( editWidgetsStoreName ).getWidgetAreas();
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
		const widgetAreas = select( editWidgetsStoreName ).getWidgetAreas();
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
	const widgetAreasIds = select( editWidgetsStoreName )
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
		...Object.keys( select( editWidgetsStoreName ).getWidgets() ),
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
	return !! state.blockInserterPanel;
}
