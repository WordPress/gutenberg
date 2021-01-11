/* eslint-disable jsdoc/no-undefined-types */
/**
 * @template {import('./types').State}TState
 * @param {import('./types').StateCreator<TState>} createState
 * @return {import('./types').StoreApi<TState>} The store.
 */
export default function create( createState ) {
	/** @type {TState} */
	let state;
	/** @type {Set<import('./types').StateListener<TState>>} */
	const listeners = new Set();

	/** @type {import('./types').SetState<TState>} */
	const setState = ( partial, replace ) => {
		const nextState =
			typeof partial === 'function' ? partial( state ) : partial;
		if ( nextState !== state ) {
			const previousState = state;
			state = replace
				? /** @type {TState} */ ( nextState )
				: Object.assign( {}, state, nextState );
			listeners.forEach( ( listener ) =>
				listener( state, previousState )
			);
		}
	};

	/** @type {import('./types').GetState<TState>} */
	const getState = () => state;

	/**
	 * @template StateSlice
	 * @param {import('./types').StateSliceListener<StateSlice>} listener
	 * @param {import('./types').StateSelector<TState, StateSlice>} selector
	 * @param {import('./types').EqualityChecker<StateSlice>} equalityFn
	 */
	const subscribeWithSelector = (
		listener,
		selector = /** @type {any} */ ( getState ),
		equalityFn = Object.is
	) => {
		/** @type {StateSlice} */
		let currentSlice = selector( state );
		function listenerToAdd() {
			const nextSlice = selector( state );
			if ( ! equalityFn( currentSlice, nextSlice ) ) {
				const previousSlice = currentSlice;
				listener( ( currentSlice = nextSlice ), previousSlice );
			}
		}
		listeners.add( listenerToAdd );
		// Unsubscribe
		return () => listeners.delete( listenerToAdd );
	};

	/**
	 * @template StateSlice
	 * @param {import('./types').StateListener<StateSlice> | import('./types').StateSliceListener<StateSlice> } listener
	 * @param {import('./types').StateSelector<TState, StateSlice>} [selector]
	 * @param {import('./types').EqualityChecker<StateSlice>} [equalityFn]
	 */
	const subscribe = ( listener, selector, equalityFn ) => {
		if ( selector || equalityFn ) {
			return subscribeWithSelector(
				/** @type {import('./types').StateSliceListener<StateSlice>} */ ( listener ),
				selector,
				equalityFn
			);
		}
		listeners.add(
			/** @type {import('./types').StateListener<TState>} */ ( listener )
		);
		// Unsubscribe
		return () =>
			listeners.delete(
				/** @type {import('./types').StateListener<TState>} */ ( listener )
			);
	};

	/**
	 * @type {import('./types').Destroy}
	 */
	const destroy = () => listeners.clear();
	const api = { setState, getState, subscribe, destroy };
	state = createState( setState, getState, api );
	return api;
}
/* eslint-enable jsdoc/no-undefined-types */
