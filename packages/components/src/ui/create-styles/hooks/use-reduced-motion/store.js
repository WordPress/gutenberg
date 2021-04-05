/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

const IS_REDUCED_MOTION_STORE = 'g2/is-reduced-motion';

const DEFAULT_STATE = {
	isReducedMotion: false,
};

/** @typedef {{ type: 'SET_IS_REDUCED_MOTION', isReducedMotion: boolean }} SetIsReducedMotion */

const actions = {
	/**
	 * @param {boolean} isReducedMotion
	 * @return {SetIsReducedMotion} Set reduced motion action.
	 */
	setIsReducedMotion: ( /** @type {boolean} */ isReducedMotion ) => ( {
		type: 'SET_IS_REDUCED_MOTION',
		isReducedMotion,
	} ),
};

registerStore( IS_REDUCED_MOTION_STORE, {
	/**
	 * @param {typeof DEFAULT_STATE} state
	 * @param {SetIsReducedMotion} action
	 */
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'SET_IS_REDUCED_MOTION':
				return {
					...state,
					isReducedMotion: action.isReducedMotion,
				};
			default:
				return state;
		}
	},

	actions,

	selectors: {
		/**
		 *
		 * @param {typeof DEFAULT_STATE} state
		 */
		getIsReducedMotion( state ) {
			return state.isReducedMotion;
		},
	},
} );

export default IS_REDUCED_MOTION_STORE;
