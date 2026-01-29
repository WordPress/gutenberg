/**
 * Internal dependencies
 */
import { a } from './a';

/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

export const someFunction = () => {
	store( 'test', {
		state: {
			a,
		},
	} );
	return a;
};
