import { store } from '@wordpress/interactivity';
import { a } from './a';

export const someFunction = () => {
	store( 'test', {
		state: {
			a,
		},
	} );
	return a;
};
