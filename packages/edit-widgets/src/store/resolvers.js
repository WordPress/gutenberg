/**
 * WordPress dependencies
 */
import { parse, createBlock, serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { resolveWidgetAreas, select, dispatch } from './controls';
import { KIND, WIDGET_AREA_ENTITY_TYPE, buildWidgetAreasQuery } from './utils';

export function* getWidgetAreas() {
	const query = buildWidgetAreasQuery();
	yield resolveWidgetAreas( query );
	let widgetAreas = yield select(
		'core',
		'getEntityRecords',
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		query
	);
	widgetAreas = widgetAreas.map( ( sidebar ) => ( {
		...sidebar,
		content: serialize(
			( sidebar.widgets || [] ).flatMap( convertWidgetToBlock )
		),
	} ) );

	yield dispatch(
		'core',
		'receiveEntityRecords',
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		widgetAreas,
		query
	);
}

function convertWidgetToBlock( widget ) {
	// @TODO: filter based on something that's less likely to change or be translated
	if ( widget.name === 'Gutenberg Block' ) {
		const parsedBlocks = parse( widget.settings.content );
		if ( ! parsedBlocks.length ) {
			// @TODO: an empty block
			return createBlock( 'core/paragraph', {}, [] );
		}
	}

	return createBlock(
		'core/legacy-widget',
		{
			id: widget.id,
			widgetClass: widget.widget_class,
			instance: widget.settings,
			idBase: widget.id_base,
			number: widget.number,

			rendered: widget.rendered,
			form: widget.form,
		},
		[]
	);
}
