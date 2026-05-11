/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';

export default {
	SPEAK( action: { message: string; ariaLive?: 'polite' | 'assertive' } ) {
		speak( action.message, action.ariaLive || 'assertive' );
	},
};
