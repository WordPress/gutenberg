/**
 * WordPress dependencies
 */
import { store, navigate, prefetch } from '@wordpress/interactivity';

const isValidLink = ( ref ) =>
	ref &&
	ref instanceof window.HTMLAnchorElement &&
	ref.href &&
	( ! ref.target || ref.target === '_self' ) &&
	ref.origin === window.location.origin;

const isValidEvent = ( event ) =>
	event.button === 0 && // left clicks only
	! event.metaKey && // open in new tab (mac)
	! event.ctrlKey && // open in new tab (windows)
	! event.altKey && // download
	! event.shiftKey &&
	! event.defaultPrevented;

store( {
	actions: {
		core: {
			query: {
				navigate: async ( { event, ref } ) => {
					if ( isValidLink( ref ) && isValidEvent( event ) ) {
						event.preventDefault();
						await navigate( ref.href );
					}
				},
				prefetch: async ( { ref } ) => {
					if ( isValidLink( ref ) ) {
						await prefetch( ref.href );
					}
				},
			},
		},
	},
} );
