/**
 * WordPress dependencies
 */
import { createBlock, parse } from '@wordpress/blocks';

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
