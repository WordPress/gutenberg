/**
 * WordPress dependencies
 */
import { store as wpStore } from '@wordpress/interactivity';

function toggleSearch( store ) {
	store.context.core.search.isSearchCollapsed =
		! store.context.core.search.isSearchCollapsed;
}

wpStore( {
	actions: {
		core: {
			search: {
				toggleSearch,
			},
		},
	},
} );

// Listen for click events anywhere on the document so this script can be loaded asynchronously in the head.
document.addEventListener(
	'click',
	() => {
		// Get the ancestor expandable Search block of the clicked element.
		console.log( 'state', state );
	},
	{ passive: true }
);
