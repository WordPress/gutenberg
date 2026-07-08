/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state, actions } = store( 'directive-input', {
	state: {
		text: 'hello',
		checkedVal: false,
		num: 0,
		pet: 'dog',
		petRadio: 'dog',
		rangeVal: 50,
		textareaVal: 'default',
		multiPet: [ 'dog' ],
		tags: [ 'a', '' ],
	},
	actions: {
		toggleText() {
			state.text = state.text === 'hello' ? 'world' : 'hello';
		},
		toggleChecked() {
			state.checkedVal = ! state.checkedVal;
		},
		toggleNum() {
			state.num = 99;
		},
		togglePet() {
			const next = { dog: 'cat', cat: 'bird', bird: 'dog' };
			state.pet = next[ state.pet ] || 'dog';
		},
		toggleMultiPet() {
			state.multiPet =
				state.multiPet[ 0 ] === 'dog'
					? [ 'cat', 'bird' ]
					: [ 'dog' ];
		},
	},
} );
