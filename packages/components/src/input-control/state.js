/**
 * WordPress dependencies
 */
import { useReducer } from '@wordpress/element';

const initialStateReducer = ( state ) => state;

const initialInputControlState = {
	_event: {},
	isDragEnabled: false,
	isDirty: false,
	isDragging: false,
	isPressEnterToSubmit: false,
	initialValue: '',
	value: '',
};

const actionTypes = {
	CHANGE: 'CHANGE',
	DRAG_END: 'DRAG_END',
	DRAG_START: 'DRAG_START',
	DRAG: 'DRAG',
	PRESS_DOWN: 'PRESS_DOWN',
	PRESS_ENTER: 'PRESS_ENTER',
	PRESS_UP: 'PRESS_UP',
	RESET: 'RESET',
	SUBMIT: 'SUBMIT',
};

export const inputControlActionTypes = actionTypes;

function mergeInitialState( initialState = initialInputControlState ) {
	const { value } = initialState;

	return {
		...initialInputControlState,
		...initialState,
		initialValue: value,
	};
}

function inputControlStateReducer( stateReducer = initialStateReducer ) {
	return ( state, action ) => {
		let nextState = { ...state };
		const { type, payload } = action;

		switch ( type ) {
			/**
			 * Keyboard events
			 */
			case actionTypes.PRESS_UP:
				nextState.isDirty = false;
				break;

			case actionTypes.PRESS_DOWN:
				nextState.isDirty = false;
				break;

			/**
			 * Drag events
			 */
			case actionTypes.DRAG_START:
				nextState.isDragging = true;
				break;

			case actionTypes.DRAG:
				break;

			case actionTypes.DRAG_END:
				nextState.isDragging = false;
				break;

			/**
			 * Input events
			 */
			case actionTypes.CHANGE:
				nextState.value = payload.value;
				if ( state.isPressEnterToChange ) {
					nextState.isDirty = true;
				}
				break;

			case actionTypes.SUBMIT:
				nextState.value = payload.value;
				nextState.isDirty = false;
				break;

			case actionTypes.RESET:
				nextState.value = payload.value || state.initialValue;
				nextState.isDirty = false;
				break;
		}

		if ( payload.event ) {
			nextState._event = payload.event;
		}

		/**
		 * This enables consuming components to adjust the state as needed.
		 * This technique uses the "stateReducer" design pattern:
		 * https://kentcdodds.com/blog/the-state-reducer-pattern/
		 */
		nextState = stateReducer( nextState, action );

		return nextState;
	};
}

export function useInputControlStateReducer(
	stateReducer = initialStateReducer,
	initialState = initialInputControlState
) {
	const [ state, dispatch ] = useReducer(
		inputControlStateReducer( stateReducer ),
		mergeInitialState( initialState )
	);

	const createChangeEvent = ( type ) => ( nextValue, event ) => {
		dispatch( {
			type,
			payload: { value: nextValue, event: { ...event } },
		} );
	};

	const createKeyEvent = ( type ) => ( event ) => {
		dispatch( { type, payload: { event: { ...event } } } );
	};

	const createDragEvent = ( type ) => ( dragProps ) => {
		dispatch( { type, payload: dragProps } );
	};

	/**
	 * Actions for the reducer
	 */

	const change = createChangeEvent( actionTypes.CHANGE );
	const submit = createChangeEvent( actionTypes.SUBMIT );
	const reset = createChangeEvent( actionTypes.RESET );

	const dragStart = createDragEvent( actionTypes.DRAG_START );
	const drag = createDragEvent( actionTypes.DRAG );
	const dragEnd = createDragEvent( actionTypes.DRAG_END );

	const pressUp = createKeyEvent( actionTypes.PRESS_UP );
	const pressDown = createKeyEvent( actionTypes.PRESS_DOWN );
	const pressEnter = createKeyEvent( actionTypes.PRESS_ENTER );

	return {
		change,
		dispatch,
		drag,
		dragEnd,
		dragStart,
		pressDown,
		pressEnter,
		pressUp,
		reset,
		state,
		submit,
	};
}
