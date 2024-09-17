/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';
import { getWidgetIdFromBlock } from '@wordpress/widgets';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

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

const EMPTY_INSERTION_POINT = {
	rootClientId: undefined,
	insertionIndex: undefined,
};

/**
 * Returns all API widgets.
 *
 * @return {Object[]} API List of widgets.
 */
export const getWidgets = createRegistrySelector( ( select ) =>
	createSelector(
		() => {
			const widgets = select( coreStore ).getEntityRecords(
				'root',
				'widget',
				buildWidgetsQuery()
			);

			return (
				// Key widgets by their ID.
				widgets?.reduce(
					( allWidgets, widget ) => ( {
						...allWidgets,
						[ widget.id ]: widget,
					} ),
					{}
				) ?? {}
			);
		},
		() => [
			select( coreStore ).getEntityRecords(
				'root',
				'widget',
				buildWidgetsQuery()
			),
		]
	)
);

/**
 * Returns API widget data for a particular widget ID.
 *
 * @param {number} id Widget ID.
 *
 * @return {Object} API widget data for a particular widget ID.
 */
export const getWidget = createRegistrySelector(
	( select ) => ( state, id ) => {
		const widgets = select( editWidgetsStoreName ).getWidgets();
		return widgets[ id ];
	}
);

/**
 * Returns all API widget areas.
 *
 * @return {Object[]} API List of widget areas.
 */
export const getWidgetAreas = createRegistrySelector( ( select ) => () => {
	const query = buildWidgetAreasQuery();
	return select( coreStore ).getEntityRecords(
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
			const post = select( coreStore ).getEditedEntityRecord(
				KIND,
				POST_TYPE,
				buildWidgetAreaPostId( widgetArea.id )
			);
			const blockWidgetIds = post.blocks.map( ( block ) =>
				getWidgetIdFromBlock( block )
			);
			return blockWidgetIds.includes( widgetId );
		} );
	}
);

/**
 * Given a child client id, returns the parent widget area block.
 *
 * @param {string} clientId The client id of a block in a widget area.
 *
 * @return {WPBlock} The widget area block.
 */
export const getParentWidgetAreaBlock = createRegistrySelector(
	( select ) => ( state, clientId ) => {
		const { getBlock, getBlockName, getBlockParents } =
			select( blockEditorStore );
		const blockParents = getBlockParents( clientId );
		const widgetAreaClientId = blockParents.find(
			( parentClientId ) =>
				getBlockName( parentClientId ) === 'core/widget-area'
		);
		return getBlock( widgetAreaClientId );
	}
);

/**
 * Returns all edited widget area entity records.
 *
 * @return {Object[]} List of edited widget area entity records.
 */
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
				select( coreStore ).hasEditsForEntityRecord(
					KIND,
					POST_TYPE,
					buildWidgetAreaPostId( id )
				)
			)
			.map( ( { id } ) =>
				select( coreStore ).getEditedEntityRecord(
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
 * @param {string} referenceWidgetName Optional. If given, only reference widgets with this name will be returned.
 * @return {Array}  List of all blocks representing reference widgets
 */
export const getReferenceWidgetBlocks = createRegistrySelector(
	( select ) =>
		( state, referenceWidgetName = null ) => {
			const results = [];
			const widgetAreas = select( editWidgetsStoreName ).getWidgetAreas();
			for ( const _widgetArea of widgetAreas ) {
				const post = select( coreStore ).getEditedEntityRecord(
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

/**
 * Returns true if any widget area is currently being saved.
 *
 * @return {boolean} True if any widget area is currently being saved. False otherwise.
 */
export const isSavingWidgetAreas = createRegistrySelector( ( select ) => () => {
	const widgetAreasIds = select( editWidgetsStoreName )
		.getWidgetAreas()
		?.map( ( { id } ) => id );
	if ( ! widgetAreasIds ) {
		return false;
	}

	for ( const id of widgetAreasIds ) {
		const isSaving = select( coreStore ).isSavingEntityRecord(
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
		const isSaving = select( coreStore ).isSavingEntityRecord(
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
 *
 * @return {boolean} True if the widget area is open.
 */
export const getIsWidgetAreaOpen = ( state, clientId ) => {
	const { widgetAreasOpenState } = state;
	return !! widgetAreasOpenState[ clientId ];
};

/**
 * Returns true if the inserter is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the inserter is opened.
 */
export function isInserterOpened( state ) {
	return !! state.blockInserterPanel;
}

/**
 * Get the insertion point for the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID and index to insert at.
 */
export function __experimentalGetInsertionPoint( state ) {
	if ( typeof state.blockInserterPanel === 'boolean' ) {
		return EMPTY_INSERTION_POINT;
	}

	return state.blockInserterPanel;
}

/**
 * Returns true if a block can be inserted into a widget area.
 *
 * @param {Array}  state     The open state of the widget areas.
 * @param {string} blockName The name of the block being inserted.
 *
 * @return {boolean} True if the block can be inserted in a widget area.
 */
export const canInsertBlockInWidgetArea = createRegistrySelector(
	( select ) => ( state, blockName ) => {
		// Widget areas are always top-level blocks, which getBlocks will return.
		const widgetAreas = select( blockEditorStore ).getBlocks();

		// Makes an assumption that a block that can be inserted into one
		// widget area can be inserted into any widget area. Uses the first
		// widget area for testing whether the block can be inserted.
		const [ firstWidgetArea ] = widgetAreas;
		return select( blockEditorStore ).canInsertBlockType(
			blockName,
			firstWidgetArea.clientId
		);
	}
);

/**
 * Returns true if the list view is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the list view is opened.
 */
export function isListViewOpened( state ) {
	return state.listViewPanel;
}
