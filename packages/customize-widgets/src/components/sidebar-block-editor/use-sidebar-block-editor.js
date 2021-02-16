/**
 * External dependencies
 */
import { invert, omit, keyBy, isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize, parse, createBlock } from '@wordpress/blocks';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';

function blockToWidget( block, existingWidget = null ) {
	let widget;

	if ( block.name === 'core/legacy-widget' ) {
		const isReferenceWidget = !! block.attributes.referenceWidgetName;
		if ( isReferenceWidget ) {
			widget = {
				id: block.attributes.referenceWidgetName,
				instance: block.attributes.instance,
			};
		} else {
			widget = {
				widgetClass: block.attributes.widgetClass,
				idBase: block.attributes.idBase,
				instance: block.attributes.instance,
			};
		}
	} else {
		widget = {
			idBase: 'block',
			widgetClass: 'WP_Widget_Block',
			instance: { content: serialize( block ) },
		};
	}

	return {
		...omit( existingWidget, [ 'form', 'rendered' ] ),
		...widget,
	};
}

function widgetToBlock( widget, existingBlock = null ) {
	let block;

	// FIXME: We'll never get it here with blocks, we need to update this.
	if ( widget.widgetClass === 'WP_Widget_Block' ) {
		const parsedBlocks = parse( widget.instance.content );
		block = parsedBlocks.length
			? parsedBlocks[ 0 ]
			: createBlock( 'core/paragraph', {} );
	} else {
		const attributes = {
			name: widget.name,
			form: widget.form,
			instance: widget.instance,
			idBase: widget.idBase,
			number: widget.number,
		};

		const isReferenceWidget = ! widget.widgetClass;
		if ( isReferenceWidget ) {
			attributes.referenceWidgetName = widget.id;
		} else {
			attributes.widgetClass = widget.widgetClass;
		}

		block = createBlock( 'core/legacy-widget', attributes, [] );
	}

	return {
		...block,
		clientId: existingBlock?.clientId ?? block.clientId,
	};
}

function initState( sidebar ) {
	const state = { blocks: [], widgetIds: {} };

	for ( const widgetId of sidebar.getWidgetIds() ) {
		const widget = sidebar.getWidget( widgetId );
		const block = widgetToBlock( widget );
		state.blocks.push( block );
		state.widgetIds[ block.clientId ] = widgetId;
	}

	return state;
}

export default function useSidebarBlockEditor( sidebar ) {
	// TODO: Could/should optimize these data structures so that there's less
	// array traversal. In particular, setBlocks() is a really hot path.

	const [ state, setState ] = useState( () => initState( sidebar ) );

	const ignoreIncoming = useRef( false );

	useEffect( () => {
		const handler = ( event ) => {
			if ( ignoreIncoming.current ) {
				return;
			}

			switch ( event.type ) {
				case 'widgetAdded': {
					const { widgetId } = event;
					const block = blockToWidget(
						sidebar.getWidget( widgetId )
					);
					setState( ( lastState ) => ( {
						blocks: [ ...lastState.blocks, block ],
						widgetIds: {
							...lastState.widgetIds,
							[ block.clientId ]: widgetId,
						},
					} ) );
					break;
				}

				case 'widgetRemoved': {
					const { widgetId } = event;
					const blockClientId = invert( state.widgetIds )[ widgetId ];
					setState( ( lastState ) => ( {
						blocks: lastState.blocks.filter(
							( { clientId } ) => clientId !== blockClientId
						),
						widgetIds: omit( lastState.widgetIds, blockClientId ),
					} ) );
					break;
				}

				case 'widgetChanged': {
					const { widgetId } = event;
					const blockClientIdToUpdate = invert( state.widgetIds )[
						widgetId
					];
					const blockToUpdate = state.blocks.find(
						( { clientId } ) => clientId === blockClientIdToUpdate
					);
					const updatedBlock = widgetToBlock(
						sidebar.getWidget( widgetId ),
						blockToUpdate
					);
					setState( ( lastState ) => ( {
						...lastState,
						blocks: lastState.blocks.map( ( block ) =>
							block.clientId === blockClientIdToUpdate
								? updatedBlock
								: block
						),
					} ) );
					break;
				}

				case 'widgetsReordered':
					const { widgetIds } = event;
					const blockClientIds = invert( state.widgetIds );
					const blocksByClientId = keyBy( state.blocks, 'clientId' );
					setState( ( lastState ) => ( {
						...lastState,
						blocks: widgetIds.map(
							( widgetId ) =>
								blocksByClientId[ blockClientIds[ widgetId ] ]
						),
					} ) );
					break;
			}
		};

		sidebar.subscribe( handler );
		return () => sidebar.unsubscribe( handler );
	}, [ sidebar ] );

	const onChangeBlocks = useCallback(
		( nextBlocks ) => {
			ignoreIncoming.current = true;

			let nextWidgetIds = state.widgetIds;

			const blocksByClientId = keyBy( state.blocks, 'clientId' );

			const seen = {};

			for ( const nextBlock of nextBlocks ) {
				if ( nextBlock.clientId in blocksByClientId ) {
					const block = blocksByClientId[ nextBlock.clientId ];
					if ( ! isEqual( block, nextBlock ) ) {
						const widgetId = state.widgetIds[ nextBlock.clientId ];
						const widgetToUpdate = sidebar.getWidget( widgetId );
						const widget = blockToWidget(
							nextBlock,
							widgetToUpdate
						);
						sidebar.updateWidget( widget );
					}
				} else {
					const widget = blockToWidget( nextBlock );
					const widgetId = sidebar.addWidget( widget );
					if ( nextWidgetIds === state.widgetIds ) {
						nextWidgetIds = { ...state.widgetIds };
					}
					nextWidgetIds[ nextBlock.clientId ] = widgetId;
				}

				seen[ nextBlock.clientId ] = true;
			}

			for ( const block of state.blocks ) {
				if ( ! seen[ block.clientId ] ) {
					const widgetId = state.widgetIds[ block.clientId ];
					sidebar.removeWidget( widgetId );
				}
			}

			if (
				nextBlocks.length === state.blocks.length &&
				! isEqual(
					nextBlocks.map( ( { clientId } ) => clientId ),
					state.blocks.map( ( { clientId } ) => clientId )
				)
			) {
				const order = nextBlocks.map(
					( { clientId } ) => state.widgetIds[ clientId ]
				);
				sidebar.setWidgetIds( order );
			}

			setState( ( lastState ) => ( {
				...lastState,
				blocks: nextBlocks,
				widgetIds: nextWidgetIds,
			} ) );

			ignoreIncoming.current = false;
		},
		[ state, sidebar ]
	);

	return [ state.blocks, onChangeBlocks, onChangeBlocks ];
}
