/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'directive-input', {
	state: {
		text: 'hello',
		checkedVal: false,
		num: 0,
		pet: 'dog',
	},
} );
