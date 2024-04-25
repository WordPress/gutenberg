/**
 * WordPress dependencies
 */
import { store, getElement } from '@wordpress/interactivity';

// A non-object state should never be allowed.
store( 'test/store', { state: [ 'wrong' ] } );

const { state } = store( 'test/store', {
	state: {
		0: 'right',
		get isNotProxified() {
			const { ref } = getElement();
			return state.elementRef === ref;
		},
	},
	callbacks: {
		init() {
			const { ref } = getElement();
			state.elementRef = ref; // HTMLElement
		},
	},
} );
