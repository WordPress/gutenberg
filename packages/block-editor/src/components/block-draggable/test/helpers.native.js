/**
 * External dependencies
 */
import {
	act,
	advanceAnimationByFrames,
	fireEvent,
	initializeEditor,
	screen,
	waitForStoreResolvers,
	within,
} from 'test/helpers';
import { fireGestureHandler } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';

// Touch event type constants have been extracted from original source code, as they are not exported in the package.
// Reference: https://github.com/software-mansion/react-native-gesture-handler/blob/90895e5f38616a6be256fceec6c6a391cd9ad7c7/src/TouchEventType.ts
export const TouchEventType = {
	UNDETERMINED: 0,
	TOUCHES_DOWN: 1,
	TOUCHES_MOVE: 2,
	TOUCHES_UP: 3,
	TOUCHES_CANCELLED: 4,
};

const DEFAULT_TOUCH_EVENTS = [
	{
		id: 1,
		eventType: TouchEventType.TOUCHES_DOWN,
		x: 0,
		y: 0,
	},
];

/**
 * @typedef  {Object} WPBlockWithLayout
 * @property {string} name          Name of the block (e.g. Paragraph).
 * @property {string} html          HTML content.
 * @property {Object} layout        Layout data.
 * @property {Object} layout.x      X position.
 * @property {Object} layout.y      Y position.
 * @property {Object} layout.width  Width.
 * @property {Object} layout.height Height.
 */

/**
 * Initialize the editor with an array of blocks that include their HTML and layout.
 *
 * @param {WPBlockWithLayout[]} blocks Initial blocks.
 *
 * @return {import('@testing-library/react-native').RenderAPI} The Testing Library screen.
 */
export const initializeWithBlocksLayouts = async ( blocks ) => {
	const initialHtml = blocks.map( ( block ) => block.html ).join( '\n' );

	await initializeEditor( { initialHtml } );

	const waitPromises = [];
	const blockListItems = screen.getAllByTestId( 'block-list-item-cell' );
	// Check that rendered block list items match expected block count.
	expect( blockListItems.length ).toBe( blocks.length );

	blocks.forEach( ( block, index ) => {
		const element = blockListItems[ index ];
		// "onLayout" event will populate the blocks layouts data.
		fireEvent( element, 'layout', {
			nativeEvent: { layout: block.layout },
		} );
		if ( block.nestedBlocks ) {
			// Nested blocks are rendered via the FlatList of the inner block list.
			// In order to render the items of a FlatList, it's required to trigger the
			// "onLayout" event. Additionally, the call is wrapped over "waitForStoreResolvers"
			// because the nested blocks might make API requests (e.g. the Gallery block).
			waitPromises.push(
				waitForStoreResolvers( () =>
					fireEvent(
						within( element ).getByTestId( 'block-list-wrapper' ),
						'layout',
						{
							nativeEvent: {
								layout: {
									width: block.layout.width,
									height: block.layout.height,
								},
							},
						}
					)
				)
			);

			block.nestedBlocks.forEach( ( nestedBlock, nestedIndex ) => {
				const nestedA11yLabel = new RegExp(
					`${ nestedBlock.name } Block\\. Row ${ nestedIndex + 1 }`
				);
				const [ nestedElement ] =
					within( element ).getAllByLabelText( nestedA11yLabel );
				fireEvent( nestedElement, 'layout', {
					nativeEvent: { layout: nestedBlock.layout },
				} );
			} );
		}
	} );
	await Promise.all( waitPromises );

	return screen;
};

/**
 * Fires long-press gesture event on a block.
 *
 * @param {import('react-test-renderer').ReactTestInstance} block                  Block test instance.
 * @param {string}                                          testID                 Id for querying the draggable trigger element.
 * @param {Object}                                          [options]              Configuration options for the gesture event.
 * @param {boolean}                                         [options.failed]       Determines if the gesture should fail.
 * @param {number}                                          [options.triggerIndex] In case there are multiple draggable triggers, this specifies the index to use.
 */
export const fireLongPress = (
	block,
	testID,
	{ failed = false, triggerIndex } = {}
) => {
	const draggableTrigger =
		typeof triggerIndex !== 'undefined'
			? within( block ).getAllByTestId( testID )[ triggerIndex ]
			: within( block ).getByTestId( testID );
	if ( failed ) {
		fireGestureHandler( draggableTrigger, [ { state: State.FAILED } ] );
	} else {
		fireGestureHandler( draggableTrigger, [
			{ oldState: State.BEGAN, state: State.ACTIVE },
			{ state: State.ACTIVE },
			{ state: State.END },
		] );
	}
	// Advance timers one frame to ensure that shared values
	// are updated and trigger animation reactions.
	act( () => advanceAnimationByFrames( 1 ) );
};

/**
 * Fires pan gesture event on a BlockDraggable component.
 *
 * @param {import('react-test-renderer').ReactTestInstance} blockDraggable BlockDraggable test instance.
 * @param {Object}                                          [touchEvents]  Array of touch events to dispatch on the pan gesture.
 */
export const firePanGesture = (
	blockDraggable,
	touchEvents = DEFAULT_TOUCH_EVENTS
) => {
	const gestureTouchEvents = touchEvents.map(
		( { eventType, ...touchEvent } ) => ( {
			allTouches: [ touchEvent ],
			eventType,
		} )
	);
	fireGestureHandler( blockDraggable, [
		// TOUCHES_DOWN event is only received on ACTIVE state, so we have to fire it manually.
		{ oldState: State.BEGAN, state: State.ACTIVE },
		...gestureTouchEvents,
		{ state: State.END },
	] );
	// Advance timers one frame to ensure that shared values
	// are updated and trigger animation reactions.
	act( () => advanceAnimationByFrames( 1 ) );
};

/**
 * Gets the draggable chip element.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen The Testing Library screen.
 *
 * @return {import('react-test-renderer').ReactTestInstance} Draggable chip test instance.
 */
export const getDraggableChip = ( { getByTestId } ) => {
	let draggableChip;
	try {
		draggableChip = getByTestId( 'draggable-chip' );
	} catch ( e ) {
		// NOOP.
	}
	return draggableChip;
};
