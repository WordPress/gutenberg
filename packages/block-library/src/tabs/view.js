/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

store( 'core/tabs', {
	actions: {
		setActiveTab: ( index ) => {
			const context = getContext();
			context.activeTab = index;
		},
	},
} );
