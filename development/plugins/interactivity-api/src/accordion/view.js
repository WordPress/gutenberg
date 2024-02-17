/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

store( 'interactiveAccordion', {
	actions: {
		toggle: () => {
			const context = getContext();
			context.isOpen = ! context.isOpen;
		},
	},
} );
