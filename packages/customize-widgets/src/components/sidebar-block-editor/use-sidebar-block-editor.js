/**
 * External dependencies
 */
import { omit, isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize, parse, createBlock } from '@wordpress/blocks';
import { useState, useEffect, useCallback } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { getWidgetIdFromBlock, addWidgetIdToBlock } from '@wordpress/widgets';

function blockToWidget( block, existingWidget = null ) {
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

	return {
		...omit( existingWidget, [ 'form', 'rendered' ] ),
		...widget,
	};
}

function widgetToBlock( { id, idBase, number, instance } ) {
	let block;

	const {
		encoded_serialized_instance: encoded,
		instance_hash_key: hash,
		raw_instance: raw,
		...rest
	} = instance;

	if ( idBase === 'block' ) {
		const parsedBlocks = parse( raw.content );
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

function widgetsToBlocks( widgets ) {
	return widgets.map( ( widget ) => widgetToBlock( widget ) );
}

export default function useSidebarBlockEditor( sidebar ) {
	const [ blocks, setBlocks ] = useState( () =>
		widgetsToBlocks( sidebar.getWidgets() )
	);

	useEffect( () => {
		return sidebar.subscribe( ( prevWidgets, nextWidgets ) => {
			setBlocks( ( prevBlocks ) => {
				const prevWidgetsMap = new Map(
					prevWidgets.map( ( widget ) => [ widget.id, widget ] )
				);
				const prevBlocksMap = new Map(
					prevBlocks.map( ( block ) => [
						getWidgetIdFromBlock( block ),
						block,
					] )
				);

				const nextBlocks = nextWidgets.map( ( nextWidget ) => {
					const prevWidget = prevWidgetsMap.get( nextWidget.id );

					// Bail out updates.
					if ( prevWidget && prevWidget === nextWidget ) {
						return prevBlocksMap.get( nextWidget.id );
					}

					return widgetToBlock( nextWidget );
				} );

				// Bail out updates.
				if ( isShallowEqual( prevBlocks, nextBlocks ) ) {
					return prevBlocks;
				}

				return nextBlocks;
			} );
		} );
	}, [ sidebar ] );

	const onChangeBlocks = useCallback(
		( nextBlocks ) => {
			setBlocks( ( prevBlocks ) => {
				if ( isShallowEqual( prevBlocks, nextBlocks ) ) {
					return prevBlocks;
				}

				const prevBlocksMap = new Map(
					prevBlocks.map( ( block ) => [
						getWidgetIdFromBlock( block ),
						block,
					] )
				);

				const nextWidgets = nextBlocks.map( ( nextBlock ) => {
					const widgetId = getWidgetIdFromBlock( nextBlock );

					// Update existing widgets.
					if ( widgetId && prevBlocksMap.has( widgetId ) ) {
						const prevBlock = prevBlocksMap.get( widgetId );
						const prevWidget = sidebar.getWidget( widgetId );

						// Bail out updates by returning the previous widgets.
						// Deep equality is necessary until the block editor's internals changes.
						if ( isEqual( nextBlock, prevBlock ) && prevWidget ) {
							return prevWidget;
						}

						return blockToWidget( nextBlock, prevWidget );
					}

					// Add a new widget.
					return blockToWidget( nextBlock );
				} );

				// Bail out updates if the updated widgets are the same.
				if ( isShallowEqual( sidebar.getWidgets(), nextWidgets ) ) {
					return prevBlocks;
				}

				const addedWidgetIds = sidebar.setWidgets( nextWidgets );

				return nextBlocks.reduce(
					( updatedNextBlocks, nextBlock, index ) => {
						const addedWidgetId = addedWidgetIds[ index ];

						if ( addedWidgetId !== null ) {
							// Only create a new instance if necessary to prevent
							// the whole editor from re-rendering on every edit.
							if ( updatedNextBlocks === nextBlocks ) {
								updatedNextBlocks = nextBlocks.slice();
							}

							updatedNextBlocks[ index ] = addWidgetIdToBlock(
								nextBlock,
								addedWidgetId
							);
						}

						return updatedNextBlocks;
					},
					nextBlocks
				);
			} );
		},
		[ sidebar ]
	);

	return [ blocks, onChangeBlocks, onChangeBlocks ];
}
