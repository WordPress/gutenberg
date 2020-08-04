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

	const widgetIdToClientId = {};
	for ( const widgetArea of widgetAreas ) {
		const blocks = [];
		for ( const widget of widgetArea.widgets ) {
			const block = transformWidgetToBlock( widget );
			widgetIdToClientId[ widget.id ] = block.clientId;
			blocks.push( block );
		}

		// Persist the actual post containing the navigation block
		const widgetAreaBlock = createBlock(
			'core/widget-area',
			{
				id: widgetArea.id,
				name: widgetArea.name,
			},
			blocks
		);

		// Dispatch startResolution and finishResolution to skip the execution of the real getEntityRecord resolver - it would
		// issue an http request and fail.
		const stubPost = createStubPost( widgetArea.id, widgetAreaBlock );
		const args = [ KIND, POST_TYPE, stubPost.id ];
		yield dispatch( 'core', 'startResolution', 'getEntityRecord', args );
		yield persistPost( stubPost );
		yield dispatch( 'core', 'finishResolution', 'getEntityRecord', args );
	}

	yield {
		type: 'SET_WIDGET_TO_CLIENT_ID_MAPPING',
		mapping: widgetIdToClientId,
	};
}

const createStubPost = ( widgetAreaId, widgetAreaBlock ) => {
	const id = buildWidgetAreaPostId( widgetAreaId );
	return {
		id,
		slug: id,
		status: 'draft',
		type: 'page',
		blocks: [ widgetAreaBlock ],
		meta: {
			widgetAreaId,
		},
	};
};

const persistPost = ( post ) =>
	dispatch(
		'core',
		'receiveEntityRecords',
		KIND,
		POST_TYPE,
		post,
		{ id: post.id },
		false
	);
