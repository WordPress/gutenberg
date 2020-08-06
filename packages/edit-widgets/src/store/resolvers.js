/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { resolveWidgetAreas, select, dispatch } from './controls';
import {
	KIND,
	POST_TYPE,
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
	for ( const widgetArea of widgetAreas ) {
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

	yield persistStubPost( buildWidgetAreasPostId(), widgetAreaBlocks );

	yield {
		type: 'SET_WIDGET_TO_CLIENT_ID_MAPPING',
		mapping: widgetIdToClientId,
	};
}

const persistStubPost = function* ( id, blocks ) {
	const stubPost = createStubPost( id, blocks );
	const args = [ KIND, POST_TYPE, id ];
	yield dispatch( 'core', 'startResolution', 'getEntityRecord', args );
	yield dispatch(
		'core',
		'receiveEntityRecords',
		KIND,
		POST_TYPE,
		stubPost,
		{ id: stubPost.id },
		false
	);
	yield dispatch( 'core', 'finishResolution', 'getEntityRecord', args );
	return stubPost;
};

const createStubPost = ( id, blocks ) => ( {
	id,
	slug: id,
	status: 'draft',
	type: 'page',
	blocks,
	meta: {
		widgetAreaId: id,
	},
} );
