/**
 * WordPress dependencies
 */
import { createBlock, parse, serialize } from '@wordpress/blocks';

export function transformWidgetToBlock( widget ) {
	if ( widget.widget_class === 'WP_Widget_Block' ) {
		const parsedBlocks = parse( widget.settings.content );
		if ( ! parsedBlocks.length ) {
			return createBlock( 'core/paragraph', {}, [] );
		}
		return parsedBlocks[ 0 ];
	}

	return createBlock(
		'core/legacy-widget',
		{
			rendered: widget.rendered,
			form: widget.form,
			id: widget.id,
			widgetClass: widget.widget_class,
			instance: widget.settings,
			idBase: widget.id_base,
			number: widget.number,
		},
		[]
	);
}

export function transformBlockToWidget( block, relatedWidget = {} ) {
	const { name, attributes } = block;
	if ( name === 'core/legacy-widget' ) {
		const widget = {
			...relatedWidget,
			id: attributes.id,
			widget_class: attributes.widgetClass,
			number: attributes.number,
			id_base: attributes.idBase,
			settings: attributes.instance,
		};
		delete widget.form;
		delete widget.rendered;
		return widget;
	}

	return {
		...relatedWidget,
		id_base: 'block',
		widget_class: 'WP_Widget_Block',
		settings: {
			content: serialize( block ),
		},
	};
}
