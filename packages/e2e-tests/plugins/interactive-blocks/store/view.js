/**
 * WordPress dependencies
 */
import { store, getElement } from '@wordpress/interactivity';


const { state } = store( 'test/store', {
	state: {
		get isNotProxified() {
			const { ref } = getElement();
			return state.elementRef === ref;
		}
	},
	callbacks: {
		init() {
			const { ref } = getElement();
			state.elementRef = ref; // HTMLElement
		}
	}
} )
