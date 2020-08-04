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
		return {
			id: attributes.id,
			widget_class: attributes.widgetClass,
			number: attributes.number,
			id_base: attributes.idBase,
			settings: attributes.instance,
		};
	}

	return {
		id: attributes.id,
		widget_class: 'WP_Widget_Block',
		number: attributes.number,
		id_base: attributes.idBase,
		settings: attributes.instance,
		content: serialize( block ),
	};
}
