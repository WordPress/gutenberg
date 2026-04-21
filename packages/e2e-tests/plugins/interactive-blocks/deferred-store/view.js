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

const { state } = store( 'test/deferred-store/derived-state', {
	state: {
		hydrated: true,
		get existingValue() {
			return state.value;
		},
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
					get redOrGreen() {
						const { isReady } = getContext();
						return isReady ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)';
					},
					get derivedText() {
						const { isReady } = getContext();
						return isReady
							? 'client-updated text'
							: 'server-rendered text';
					},
					get radiotelephonicAlphabet() {
						const { list } = getContext();
						const dictionary = {
							a: 'alpha',
							b: 'bravo',
							c: 'charlie',
							d: 'delta',
						};
						return list.map( ( item ) => dictionary[ item ] );
					},
				},
				actions: {
					increment() {
						getContext().counter += 1;
					},
					setReady() {
						getContext().isReady = true;
					},
					addItem() {
						const { list } = getContext();
						if ( list.length === 3 ) {
							list.push( 'd' );
						}
					},
				},
			} );
		},
	},
} );
