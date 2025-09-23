/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

window.addEventListener(
	'_test_proceed_',
	() => {
		store( 'test/deferred-store', {
			state: {
				reversedText() {
					return [ ...getContext().text ].reverse().join( '' );
				},

				get reversedTextGetter() {
					return [ ...getContext().text ].reverse().join( '' );
				},
			},
		} );
	},
	{ once: true }
);

window.addEventListener(
	'_test_proceed_',
	() => {
		const { state } = store( 'test/deferred-store', {
			state: {
				number: 3,

				get double() {
					return state.number * 2;
				},
			},
		} );
	},
	{ once: true }
);

store( 'test/deferred-store/derived-state', {
	state: {
		hydrated: true,
	},
	actions: {
		load() {
			store( 'test/deferred-store/derived-state', {
				state: {
					loaded: true,
					get value() {
						const { counter } = getContext();
						return `bind-${ counter }`;
					},
					get below10() {
						const { counter } = getContext();
						return counter < 10;
					},
				},
				actions: {
					increment() {
						getContext().counter += 1;
					},
				},
			} );
		},
	},
} );
