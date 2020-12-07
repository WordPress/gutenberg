/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
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
	isPressEnterToChange: false,
	value: '',
};

const actionTypes = {
	CHANGE: 'CHANGE',
	COMMIT: 'COMMIT',
	DRAG_END: 'DRAG_END',
	DRAG_START: 'DRAG_START',
	DRAG: 'DRAG',
	INVALIDATE: 'INVALIDATE',
	PRESS_DOWN: 'PRESS_DOWN',
	PRESS_ENTER: 'PRESS_ENTER',
	PRESS_UP: 'PRESS_UP',
	RESET: 'RESET',
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
 * Composes multiple stateReducers into a single stateReducer, building
 * the pipeline to control the flow for state and actions.
 *
 * @param  {...Function} fns State reducers.
 * @return {Function} The single composed stateReducer.
 */
export const composeStateReducers = ( ...fns ) => {
	return ( ...args ) => {
		return fns.reduceRight( ( state, fn ) => {
			const fnState = fn( ...args );
			return isEmpty( fnState ) ? state : { ...state, ...fnState };
		}, {} );
	};
};

/**
 * Creates a reducer that opens the channel for external state subscription
 * and modification.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
 *
 * @param {Function} composedStateReducers A custom reducer that can subscribe and modify state.
 * @return {Function} The reducer.
 */
function inputControlStateReducer( composedStateReducers ) {
	return ( state, action ) => {
		const nextState = { ...state };
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

			case actionTypes.COMMIT:
				nextState.value = payload.value;
				nextState.isDirty = false;
				break;

			case actionTypes.RESET:
				nextState.error = null;
				nextState.isDirty = false;
				nextState.value = payload.value || state.initialValue;
				break;

			case actionTypes.UPDATE:
				nextState.value = payload.value;
				nextState.isDirty = false;
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
		 * Send the nextState + action to the composedReducers via
		 * this "bridge" mechanism. This allows external stateReducers
		 * to hook into actions, and modify state if needed.
		 */
		return composedStateReducers( nextState, action );
	};
}

/**
 * A custom hook that connects and external stateReducer with an internal
 * reducer. This hook manages the internal state of InputControl.
 * However, by connecting an external stateReducer function, other
 * components can react to actions as well as modify state before it is
 * applied.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
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
		if ( event && event.persist ) {
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
		if ( event && event.persist ) {
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
	const invalidate = createChangeEvent( actionTypes.INVALIDATE );
	const reset = createChangeEvent( actionTypes.RESET );
	const commit = createChangeEvent( actionTypes.COMMIT );
	const update = createChangeEvent( actionTypes.UPDATE );

	const dragStart = createDragEvent( actionTypes.DRAG_START );
	const drag = createDragEvent( actionTypes.DRAG );
	const dragEnd = createDragEvent( actionTypes.DRAG_END );

	const pressUp = createKeyEvent( actionTypes.PRESS_UP );
	const pressDown = createKeyEvent( actionTypes.PRESS_DOWN );
	const pressEnter = createKeyEvent( actionTypes.PRESS_ENTER );

	return {
		change,
		commit,
		dispatch,
		drag,
		dragEnd,
		dragStart,
		invalidate,
		pressDown,
		pressEnter,
		pressUp,
		reset,
		state,
		update,
	};
}
