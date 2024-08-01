/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

function initTabs( ref ) {}

store( 'core/tabs', {
	actions: {
		setActiveTab: ( index ) => {
			const context = getContext();
			context.activeTab = index;
		},
	},
	callbacks: {
		init: () => {
			const { ref } = getElement();
			initTabs( ref );
		},
	},
} );
