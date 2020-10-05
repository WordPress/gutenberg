/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { dispatch, resolveWidgetAreas, select } from './controls';
import { setWidgetAreasOpenState } from './actions';
import {
	KIND,
	EDITOR_TYPE,
	WIDGET_AREA_ENTITY_TYPE,
	buildWidgetAreasQuery,
	buildWidgetAreaEditorRecordId,
	buildWidgetAreasEditorRecordId,
} from './utils';
import { transformWidgetToBlock } from './transformers';

export function* getWidgetAreas() {
	const query = buildWidgetAreasQuery();
	yield resolveWidgetAreas( query );
	const widgetAreas = yield select(
		'core',
		'getEntityRecords',
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		query
	);

	const widgetAreaBlocks = [];
	const widgetIdToClientId = {};
	const sortedWidgetAreas = widgetAreas.sort( ( a, b ) => {
		if ( a.id === 'wp_inactive_widgets' ) {
			return 1;
		}
		if ( b.id === 'wp_inactive_widgets' ) {
			return -1;
		}
		return 0;
	} );
	for ( const widgetArea of sortedWidgetAreas ) {
		const widgetBlocks = [];
		for ( const widget of widgetArea.widgets ) {
			const block = transformWidgetToBlock( widget );
			widgetIdToClientId[ widget.id ] = block.clientId;
			widgetBlocks.push( block );
		}

		// Persist the editor entity containing the navigation block
		yield persistEditorEntity(
			buildWidgetAreaEditorRecordId( widgetArea.id ),
			widgetBlocks
		);

		widgetAreaBlocks.push(
			createBlock( 'core/widget-area', {
				id: widgetArea.id,
				name: widgetArea.name,
			} )
		);
	}

	const widgetAreasOpenState = {};
	widgetAreaBlocks.forEach( ( widgetAreaBlock, index ) => {
		// Defaults to open the first widget area.
		widgetAreasOpenState[ widgetAreaBlock.clientId ] = index === 0;
	} );
	yield setWidgetAreasOpenState( widgetAreasOpenState );

	yield {
		type: 'SET_WIDGET_TO_CLIENT_ID_MAPPING',
		mapping: widgetIdToClientId,
	};

	yield persistEditorEntity(
		buildWidgetAreasEditorRecordId(),
		widgetAreaBlocks
	);
}

/**
 * Persists an editor with given ID to core data store. The post is ephemeral and
 * shouldn't be saved via the API.
 *
 * @param  {string} id Editor ID.
 * @param  {Array}  blocks Blocks the editor should contain.
 * @return {Object} The editor object.
 */
const persistEditorEntity = function* ( id, blocks ) {
	const entity = createEditorEntity( id, blocks );
	yield dispatch(
		'core',
		'receiveEntityRecords',
		KIND,
		EDITOR_TYPE,
		entity,
		{ id: entity.id },
		false
	);
	return entity;
};

const createEditorEntity = ( id, blocks ) => ( {
	id,
	slug: id,
	status: 'draft',
	type: 'page',
	blocks,
	meta: {
		widgetAreaId: id,
	},
} );
