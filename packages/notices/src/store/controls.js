/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

export default {
	SPEAK( action ) {
		speak( action.message, 'assertive' );
	},
};
