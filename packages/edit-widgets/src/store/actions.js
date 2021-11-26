/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as interfaceStore } from '@wordpress/interface';
import { getWidgetIdFromBlock } from '@wordpress/widgets';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { transformBlockToWidget } from './transformers';
import {
	buildWidgetAreaPostId,
	buildWidgetAreasQuery,
	createStubPost,
	KIND,
	POST_TYPE,
	WIDGET_AREA_ENTITY_TYPE,
} from './utils';
import { STORE_NAME as editWidgetsStoreName } from './constants';

/**
 * Persists a stub post with given ID to core data store. The post is meant to be in-memory only and
 * shouldn't be saved via the API.
 *
 * @param {string} id     Post ID.
 * @param {Array}  blocks Blocks the post should consist of.
 * @return {Object} The post object.
 */
export const persistStubPost = ( id, blocks ) => ( { registry } ) => {
	const stubPost = createStubPost( id, blocks );
	registry
		.dispatch( coreStore )
		.receiveEntityRecords(
			KIND,
			POST_TYPE,
			stubPost,
			{ id: stubPost.id },
			false
		);
	return stubPost;
};

/**
 * Converts all the blocks from edited widget areas into widgets,
 * and submits a batch request to save everything at once.
 *
 * Creates a snackbar notice on either success or error.
 *
 * @return {Function} An action creator.
 */
export const saveEditedWidgetAreas = () => async ( {
	select,
	dispatch,
	registry,
} ) => {
	const editedWidgetAreas = select.getEditedWidgetAreas();
	if ( ! editedWidgetAreas?.length ) {
		return;
	}
	try {
		await dispatch.saveWidgetAreas( editedWidgetAreas );
		registry
			.dispatch( noticesStore )
			.createSuccessNotice( __( 'Widgets saved.' ), {
				type: 'snackbar',
			} );
	} catch ( e ) {
		registry.dispatch( noticesStore ).createErrorNotice(
			/* translators: %s: The error message. */
			sprintf( __( 'There was an error. %s' ), e.message ),
			{
				type: 'snackbar',
			}
		);
	}
};

/**
 * Converts all the blocks from specified widget areas into widgets,
 * and submits a batch request to save everything at once.
 *
 * @param {Object[]} widgetAreas Widget areas to save.
 * @return {Function} An action creator.
 */
export const saveWidgetAreas = ( widgetAreas ) => async ( {
	dispatch,
	registry,
} ) => {
	try {
		for ( const widgetArea of widgetAreas ) {
			await dispatch.saveWidgetArea( widgetArea.id );
		}
	} finally {
		// eslint-disable-next-line @wordpress/comment-case
		// saveEditedEntityRecord resets the resolution status, let's fix it manually.
		await registry
			.dispatch( coreStore )
			.finishResolution(
				'getEntityRecord',
				KIND,
				WIDGET_AREA_ENTITY_TYPE,
				buildWidgetAreasQuery()
			);
	}
};

/**
 * Converts all the blocks from a widget area specified by ID into widgets,
 * and submits a batch request to save everything at once.
 *
 * @param {string} widgetAreaId ID of the widget area to process.
 * @return {Function} An action creator.
 */
export const saveWidgetArea = ( widgetAreaId ) => async ( {
	dispatch,
	select,
	registry,
} ) => {
	const widgets = select.getWidgets();

	const post = registry
		.select( coreStore )
		.getEditedEntityRecord(
			KIND,
			POST_TYPE,
			buildWidgetAreaPostId( widgetAreaId )
		);

	// Get all widgets from this area
	const areaWidgets = Object.values( widgets ).filter(
		( { sidebar } ) => sidebar === widgetAreaId
	);

	// Remove all duplicate reference widget instances for legacy widgets.
	// Why? We filter out the widgets with duplicate IDs to prevent adding more than one instance of a widget
	// implemented using a function. WordPress doesn't support having more than one instance of these, if you try to
	// save multiple instances of these in different sidebars you will run into undefined behaviors.
	const usedReferenceWidgets = [];
	const widgetsBlocks = post.blocks.filter( ( block ) => {
		const { id } = block.attributes;

		if ( block.name === 'core/legacy-widget' && id ) {
			if ( usedReferenceWidgets.includes( id ) ) {
				return false;
			}
			usedReferenceWidgets.push( id );
		}
		return true;
	} );

	// Determine which widgets have been deleted. We can tell if a widget is
	// deleted and not just moved to a different area by looking to see if
	// getWidgetAreaForWidgetId() finds something.
	const deletedWidgets = [];
	for ( const widget of areaWidgets ) {
		const widgetsNewArea = select.getWidgetAreaForWidgetId( widget.id );
		if ( ! widgetsNewArea ) {
			deletedWidgets.push( widget );
		}
	}

	const batchMeta = [];
	const batchTasks = [];
	const sidebarWidgetsIds = [];
	for ( let i = 0; i < widgetsBlocks.length; i++ ) {
		const block = widgetsBlocks[ i ];
		const widgetId = getWidgetIdFromBlock( block );
		const oldWidget = widgets[ widgetId ];
		const widget = transformBlockToWidget( block, oldWidget );

		// We'll replace the null widgetId after save, but we track it here
		// since order is important.
		sidebarWidgetsIds.push( widgetId );

		// Check oldWidget as widgetId might refer to an ID which has been
		// deleted, e.g. if a deleted block is restored via undo after saving.
		if ( oldWidget ) {
			// Update an existing widget.
			registry.dispatch( coreStore ).editEntityRecord(
				'root',
				'widget',
				widgetId,
				{
					...widget,
					sidebar: widgetAreaId,
				},
				{ undoIgnore: true }
			);

			const hasEdits = registry
				.select( coreStore )
				.hasEditsForEntityRecord( 'root', 'widget', widgetId );

			if ( ! hasEdits ) {
				continue;
			}

			batchTasks.push( ( { saveEditedEntityRecord } ) =>
				saveEditedEntityRecord( 'root', 'widget', widgetId )
			);
		} else {
			// Create a new widget.
			batchTasks.push( ( { saveEntityRecord } ) =>
				saveEntityRecord( 'root', 'widget', {
					...widget,
					sidebar: widgetAreaId,
				} )
			);
		}

		batchMeta.push( {
			block,
			position: i,
			clientId: block.clientId,
		} );
	}
	for ( const widget of deletedWidgets ) {
		batchTasks.push( ( { deleteEntityRecord } ) =>
			deleteEntityRecord( 'root', 'widget', widget.id, {
				force: true,
			} )
		);
	}

	const records = await registry
		.dispatch( coreStore )
		.__experimentalBatch( batchTasks );
	const preservedRecords = records.filter(
		( record ) => ! record.hasOwnProperty( 'deleted' )
	);

	const failedWidgetNames = [];

	for ( let i = 0; i < preservedRecords.length; i++ ) {
		const widget = preservedRecords[ i ];
		const { block, position } = batchMeta[ i ];

		// Set __internalWidgetId on the block. This will be persisted to the
		// store when we dispatch receiveEntityRecords( post ) below.
		post.blocks[ position ].attributes.__internalWidgetId = widget.id;

		const error = registry
			.select( coreStore )
			.getLastEntitySaveError( 'root', 'widget', widget.id );
		if ( error ) {
			failedWidgetNames.push( block.attributes?.name || block?.name );
		}

		if ( ! sidebarWidgetsIds[ position ] ) {
			sidebarWidgetsIds[ position ] = widget.id;
		}
	}

	if ( failedWidgetNames.length ) {
		throw new Error(
			sprintf(
				/* translators: %s: List of widget names */
				__( 'Could not save the following widgets: %s.' ),
				failedWidgetNames.join( ', ' )
			)
		);
	}

	registry.dispatch( coreStore ).editEntityRecord(
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		widgetAreaId,
		{
			widgets: sidebarWidgetsIds,
		},
		{ undoIgnore: true }
	);

	dispatch( trySaveWidgetArea( widgetAreaId ) );

	registry
		.dispatch( coreStore )
		.receiveEntityRecords( KIND, POST_TYPE, post, undefined );
};

const trySaveWidgetArea = ( widgetAreaId ) => ( { registry } ) => {
	const saveErrorBefore = registry
		.select( coreStore )
		.getLastEntitySaveError( KIND, WIDGET_AREA_ENTITY_TYPE, widgetAreaId );
	registry
		.dispatch( coreStore )
		.saveEditedEntityRecord( KIND, WIDGET_AREA_ENTITY_TYPE, widgetAreaId );
	const saveErrorAfter = registry
		.select( coreStore )
		.getLastEntitySaveError( KIND, WIDGET_AREA_ENTITY_TYPE, widgetAreaId );
	if ( saveErrorAfter && saveErrorBefore !== saveErrorAfter ) {
		throw new Error( saveErrorAfter );
	}
};

/**
 * Sets the clientId stored for a particular widgetId.
 *
 * @param {number} clientId Client id.
 * @param {number} widgetId Widget id.
 *
 * @return {Object} Action.
 */
export function setWidgetIdForClientId( clientId, widgetId ) {
	return {
		type: 'SET_WIDGET_ID_FOR_CLIENT_ID',
		clientId,
		widgetId,
	};
}

/**
 * Sets the open state of all the widget areas.
 *
 * @param {Object} widgetAreasOpenState The open states of all the widget areas.
 *
 * @return {Object} Action.
 */
export function setWidgetAreasOpenState( widgetAreasOpenState ) {
	return {
		type: 'SET_WIDGET_AREAS_OPEN_STATE',
		widgetAreasOpenState,
	};
}

/**
 * Sets the open state of the widget area.
 *
 * @param {string}  clientId The clientId of the widget area.
 * @param {boolean} isOpen   Whether the widget area should be opened.
 *
 * @return {Object} Action.
 */
export function setIsWidgetAreaOpen( clientId, isOpen ) {
	return {
		type: 'SET_IS_WIDGET_AREA_OPEN',
		clientId,
		isOpen,
	};
}

/**
 * Returns an action object used to open/close the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 *
 * @return {Object} Action object.
 */
export function setIsInserterOpened( value ) {
	return {
		type: 'SET_IS_INSERTER_OPENED',
		value,
	};
}

/**
 * Returns an action object used to open/close the list view.
 *
 * @param {boolean} isOpen A boolean representing whether the list view should be opened or closed.
 * @return {Object} Action object.
 */
export function setIsListViewOpened( isOpen ) {
	return {
		type: 'SET_IS_LIST_VIEW_OPENED',
		isOpen,
	};
}

/**
 * Returns an action object signalling that the user closed the sidebar.
 *
 * @return {Object} Action creator.
 */
export const closeGeneralSidebar = () => ( { registry } ) => {
	registry
		.dispatch( interfaceStore )
		.disableComplementaryArea( editWidgetsStoreName );
};

/**
 * Action that handles moving a block between widget areas
 *
 * @param {string} clientId     The clientId of the block to move.
 * @param {string} widgetAreaId The id of the widget area to move the block to.
 */
export const moveBlockToWidgetArea = ( clientId, widgetAreaId ) => async ( {
	dispatch,
	select,
	registry,
} ) => {
	const sourceRootClientId = registry
		.select( blockEditorStore )
		.getBlockRootClientId( [ clientId ] );

	// Search the top level blocks (widget areas) for the one with the matching
	// id attribute. Makes the assumption that all top-level blocks are widget
	// areas.
	const widgetAreas = registry.select( blockEditorStore ).getBlocks();
	const destinationWidgetAreaBlock = widgetAreas.find(
		( { attributes } ) => attributes.id === widgetAreaId
	);
	const destinationRootClientId = destinationWidgetAreaBlock.clientId;

	// Get the index for moving to the end of the the destination widget area.
	const destinationInnerBlocksClientIds = registry
		.select( blockEditorStore )
		.getBlockOrder( destinationRootClientId );
	const destinationIndex = destinationInnerBlocksClientIds.length;

	// Reveal the widget area, if it's not open.
	const isDestinationWidgetAreaOpen = select.getIsWidgetAreaOpen(
		destinationRootClientId
	);

	if ( ! isDestinationWidgetAreaOpen ) {
		dispatch.setIsWidgetAreaOpen( destinationRootClientId, true );
	}

	// Move the block.
	registry
		.dispatch( blockEditorStore )
		.moveBlocksToPosition(
			[ clientId ],
			sourceRootClientId,
			destinationRootClientId,
			destinationIndex
		);
};
