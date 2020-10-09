/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { resolveWidgetAreas, select } from './controls';
import { persistStubPost, setWidgetAreasOpenState } from './actions';
import {
	KIND,
	WIDGET_AREA_ENTITY_TYPE,
	buildWidgetAreasQuery,
	buildWidgetAreaPostId,
	buildWidgetAreasPostId,
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

		// Persist the actual post containing the navigation block
		yield persistStubPost(
			buildWidgetAreaPostId( widgetArea.id ),
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

	yield persistStubPost( buildWidgetAreasPostId(), widgetAreaBlocks );
}
