// @ts-check
/**
 * WordPress dependencies
 */
import { serialize, parse, createBlock } from '@wordpress/blocks';
import { addWidgetIdToBlock } from '@wordpress/widgets';

/**
 * Convert settingId to widgetId.
 *
 * @param {string} settingId The setting id.
 * @return {string} The widget id.
 */
export function settingIdToWidgetId( settingId ) {
	const matches = settingId.match( /^widget_(.+)(?:\[(\d+)\])$/ );

	if ( matches ) {
		const idBase = matches[ 1 ];
		const number = parseInt( matches[ 2 ], 10 );

		return `${ idBase }-${ number }`;
	}

	return settingId;
}

/**
 * Transform a block to a customizable widget.
 *
 * @param {WPBlock} block          The block to be transformed from.
 * @param {Object}  existingWidget The widget to be extended from.
 * @return {Object} The transformed widget.
 */
export function blockToWidget( block, existingWidget = null ) {
	let widget;

	const isValidLegacyWidgetBlock =
		block.name === 'core/legacy-widget' &&
		( block.attributes.id || block.attributes.instance );

	if ( isValidLegacyWidgetBlock ) {
		if ( block.attributes.id ) {
			// Widget that does not extend WP_Widget.
			widget = {
				id: block.attributes.id,
			};
		} else {
			const { encoded, hash, raw, ...rest } = block.attributes.instance;

			// Widget that extends WP_Widget.
			widget = {
				idBase: block.attributes.idBase,
				instance: {
					...existingWidget?.instance,
					// Required only for the customizer.
					is_widget_customizer_js_value: true,
					encoded_serialized_instance: encoded,
					instance_hash_key: hash,
					raw_instance: raw,
					...rest,
				},
			};
		}
	} else {
		const instance = {
			content: serialize( block ),
		};
		widget = {
			idBase: 'block',
			widgetClass: 'WP_Widget_Block',
			instance: {
				raw_instance: instance,
			},
		};
	}

	const { form, rendered, ...restExistingWidget } = existingWidget || {};

	return {
		...restExistingWidget,
		...widget,
	};
}

/**
 * Transform a widget to a block.
 *
 * @param {Object} widget          The widget to be transformed from.
 * @param {string} widget.id       The widget id.
 * @param {string} widget.idBase   The id base of the widget.
 * @param {number} widget.number   The number/index of the widget.
 * @param {Object} widget.instance The instance of the widget.
 * @return {WPBlock} The transformed block.
 */
export function widgetToBlock( { id, idBase, number, instance } ) {
	let block;

	const {
		encoded_serialized_instance: encoded,
		instance_hash_key: hash,
		raw_instance: raw,
		...rest
	} = instance;

	if ( idBase === 'block' ) {
		const parsedBlocks = parse( raw.content ?? '', {
			__unstableSkipAutop: true,
		} );
		block = parsedBlocks.length
			? parsedBlocks[ 0 ]
			: createBlock( 'core/paragraph', {} );
	} else if ( number ) {
		// Widget that extends WP_Widget.
		block = createBlock( 'core/legacy-widget', {
			idBase,
			instance: {
				encoded,
				hash,
				raw,
				...rest,
			},
		} );
	} else {
		// Widget that does not extend WP_Widget.
		block = createBlock( 'core/legacy-widget', {
			id,
		} );
	}

	return addWidgetIdToBlock( block, id );
}
