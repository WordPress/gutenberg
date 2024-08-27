/**
 * WordPress dependencies
 */
import { store, getElement } from '@wordpress/interactivity';

const { state } = store( 'test/get-element', {
	state: {
		prefix: '+',
		dataSomeValue: 'Initial value',
		get someValue() {
			const { attributes } = getElement();
			return attributes[ 'data-some-value' ]; // Should this be reactive?
		},
	},
	actions: {
		mutateDOM() {
			state.prefix = '++';
			const el = document.querySelector(
				'[data-testid="read from attributes"]'
			);
			el.setAttribute( 'data-some-value', 'New DOM value' );
		},
		mutateProp() {
			const { attributes } = getElement();

			attributes[ 'data-some-value' ] = state.dataSomeValue; // Does this make sense?

			state.dataSomeValue = 'New prop value';
		},
	},
} );
