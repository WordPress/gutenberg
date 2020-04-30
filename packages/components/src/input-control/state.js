/**
 * WordPress dependencies
 */
import { useReducer } from '@wordpress/element';

const initialStateReducer = ( state ) => state;

const initialInputControlState = {
	_event: {},
	error: null,
	initialValue: '',
	isDirty: false,
	isDragEnabled: false,
	isDragging: false,
	isPressEnterToSubmit: false,
	value: '',
};

const actionTypes = {
	CHANGE: 'CHANGE',
	DRAG_END: 'DRAG_END',
	DRAG_START: 'DRAG_START',
	DRAG: 'DRAG',
	INVALIDATE: 'INVALIDATE',
	PRESS_DOWN: 'PRESS_DOWN',
	PRESS_ENTER: 'PRESS_ENTER',
	PRESS_UP: 'PRESS_UP',
	RESET: 'RESET',
	SUBMIT: 'SUBMIT',
	UPDATE: 'UPDATE',
};

export const inputControlActionTypes = actionTypes;

/**
 * Prepares initialState for the reducer.
 *
 * @param {Object} initialState The initial state.
 * @return {Object} Prepared initialState for the reducer
 */
function mergeInitialState( initialState = initialInputControlState ) {
	const { value } = initialState;

	return {
		...initialInputControlState,
		...initialState,
		initialValue: value,
	};
}

/**
 * Creates a reducer that opens the channel for external state subscription
 * and modification.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
 *
 * @param {Function} stateReducer A custom reducer that can subscribe and modify state.
 * @return {Function} The reducer.
 */
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

			case actionTypes.DRAG_END:
				nextState.isDragging = false;
				break;

			/**
			 * Input events
			 */
			case actionTypes.CHANGE:
				nextState.error = null;
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
				nextState.error = null;
				nextState.isDirty = false;
				nextState.value = payload.value || state.initialValue;
				break;

			case actionTypes.UPDATE:
				if ( payload.value !== state.value ) {
					nextState.value = payload.value;
					nextState.isDirty = false;
				}
				break;

			/**
			 * Validation
			 */
			case actionTypes.INVALIDATE:
				nextState.error = payload.error;
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

/**
 * A custom hook that connects and external stateReducer with an internal
 * reducer. This hook manages the internal state of InputControl.
 * However, by connecting an external stateReducer function, other
 * components can react to actions as well as modify state before it is
 * applied.
 *
 * @param {Function} stateReducer An external state reducer.
 * @param {Object} initialState The initial state for the reducer.
 * @return {Object} State, dispatch, and a collection of actions.
 */
export function useInputControlStateReducer(
	stateReducer = initialStateReducer,
	initialState = initialInputControlState
) {
	const [ state, dispatch ] = useReducer(
		inputControlStateReducer( stateReducer ),
		mergeInitialState( initialState )
	);

	const createChangeEvent = ( type ) => ( nextValue, event ) => {
		/**
		 * Persist allows for the (Synthetic) event to be used outside of
		 * this function call.
		 * https://reactjs.org/docs/events.html#event-pooling
		 */
		if ( event.persist ) {
			event.persist();
		}

		dispatch( {
			type,
			payload: { value: nextValue, event },
		} );
	};

	const createKeyEvent = ( type ) => ( event ) => {
		/**
		 * Persist allows for the (Synthetic) event to be used outside of
		 * this function call.
		 * https://reactjs.org/docs/events.html#event-pooling
		 */
		if ( event.persist ) {
			event.persist();
		}

		dispatch( { type, payload: { event } } );
	};

	const createDragEvent = ( type ) => ( dragProps ) => {
		dispatch( { type, payload: dragProps } );
	};

	/**
	 * Actions for the reducer
	 */
	const change = createChangeEvent( actionTypes.CHANGE );
	const inValidate = createChangeEvent( actionTypes.INVALIDATE );
	const reset = createChangeEvent( actionTypes.RESET );
	const submit = createChangeEvent( actionTypes.SUBMIT );
	const update = createChangeEvent( actionTypes.UPDATE );

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
		inValidate,
		pressDown,
		pressEnter,
		pressUp,
		reset,
		state,
		submit,
		update,
	};
}
