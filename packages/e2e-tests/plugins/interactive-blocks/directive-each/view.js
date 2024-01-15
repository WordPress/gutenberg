/**
 * WordPress dependencies
 */
import { store, navigate } from '@wordpress/interactivity';

const html = ``;

store( 'directive-each', {
	actions: {
		navigate() {
			navigate( window.location, {
				force: true,
				html,
			} );
		},
	},
} );
