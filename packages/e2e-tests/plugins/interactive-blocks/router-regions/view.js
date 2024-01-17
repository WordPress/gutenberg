/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';
// eslint-disable-next-line no-restricted-syntax
import { navigate } from '@wordpress/interactivity/router';

const { state } = store( 'router-regions', {
	state: {
		region1: {
			text: 'hydrated',
		},
		region2: {
			text: 'hydrated',
		},
		counter: {
			value: 0,
		},
	},
	actions: {
		router: {
			*navigate( e ) {
				e.preventDefault();
				yield navigate( e.target.href );
			},
			back() {
				history.back();
			},
		},
		counter: {
			increment() {
				const context = getContext();
				if ( context?.counter ) {
					context.counter.value += 1;
				} else {
					state.counter.value += 1;
				}
			},
			init() {
				const context = getContext();
				if ( context.counter ) {
					context.counter.value = context.counter.initialValue;
				}
			},
		},
	},
} );
