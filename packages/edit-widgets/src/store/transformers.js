/**
 * WordPress dependencies
 */
import { createBlock, parse, serialize } from '@wordpress/blocks';

function addWidgetIdToBlock( block, widgetId ) {
	return {
		...block,
		attributes: {
			...( block.attributes || {} ),
			__internalWidgetId: widgetId,
		},
	};
}

export function transformWidgetToBlock( widget ) {
	if ( widget.id_base === 'block' ) {
		const parsedBlocks = parse( widget.instance.raw.content );
		if ( ! parsedBlocks.length ) {
			return addWidgetIdToBlock(
				createBlock( 'core/paragraph', {}, [] ),
				widget.id
			);
		}
		return addWidgetIdToBlock( parsedBlocks[ 0 ], widget.id );
	}

	let attributes;
	if ( widget._embedded.about[ 0 ].is_multi ) {
		attributes = {
			idBase: widget.id_base,
			instance: widget.instance,
		};
	} else {
		attributes = {
			id: widget.id,
		};
	}

	return addWidgetIdToBlock(
		createBlock( 'core/legacy-widget', attributes, [] ),
		widget.id
	);
}

export function transformBlockToWidget( block, relatedWidget = {} ) {
	let widget;

	if ( block.name === 'core/legacy-widget' ) {
		widget = {
			...relatedWidget,
			id: block.attributes.id ?? relatedWidget.id,
			id_base: block.attributes.idBase ?? relatedWidget.id_base,
			instance: block.attributes.instance ?? relatedWidget.instance,
		};
	} else {
		widget = {
			...relatedWidget,
			id_base: 'block',
			instance: {
				raw: {
					content: serialize( block ),
				},
			},
		};
	}

	// Delete deprecated properties.
	delete widget.description;
	delete widget.name;
	delete widget.number;
	delete widget.settings;
	delete widget.widget_class;

	// Delete read-only properties.
	delete widget.rendered;
	delete widget.rendered_form;

	return widget;
}
