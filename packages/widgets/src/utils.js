// @ts-check
/**
 * WordPress dependencies
 */
import { parse, createBlock, serialize } from '@wordpress/blocks';

/**
 * Get the internal widget id from block.
 *
 * @typedef  {Object} Attributes
 * @property {string}     __internalWidgetId The internal widget id.
 * @typedef  {Object} Block
 * @property {Attributes} attributes         The attributes of the block.
 *
 * @param    {Block}      block              The block.
 * @return {string} The internal widget id.
 */
export function getWidgetIdFromBlock( block ) {
	return block.attributes.__internalWidgetId;
}

/**
 * Add internal widget id to block's attributes.
 *
 * @param {Block}  block    The block.
 * @param {string} widgetId The widget id.
 * @return {Block} The updated block.
 */
export function addWidgetIdToBlock( block, widgetId ) {
	return {
		...block,
		attributes: {
			...( block.attributes || {} ),
			__internalWidgetId: widgetId,
		},
	};
}

/**
 * Converts a widget entity record into a block.
 *
 * @param {Object} widget The widget entity record.
 * @return {Object} a block (converted from the entity record).
 */
export function transformWidgetToBlock( widget ) {
	if ( widget.id_base === 'block' ) {
		const parsedBlocks = parse( widget.instance.raw.content, {
			__unstableSkipAutop: true,
		} );
		if ( ! parsedBlocks.length ) {
			return createBlock( 'core/paragraph', {}, [] );
		}
		return parsedBlocks[ 0 ];
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

	return createBlock( 'core/legacy-widget', attributes, [] );
}

/**
 * Converts a block to a widget entity record.
 *
 * @param {Object}  block         The block.
 * @param {Object?} relatedWidget A related widget entity record from the API (optional).
 * @return {Object} the widget object (converted from block).
 */
export function transformBlockToWidget( block, relatedWidget = {} ) {
	let widget;

	const isValidLegacyWidgetBlock =
		block.name === 'core/legacy-widget' &&
		( block.attributes.id || block.attributes.instance );

	if ( isValidLegacyWidgetBlock ) {
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

	// Delete read-only properties.
	delete widget.rendered;
	delete widget.rendered_form;

	return widget;
}
