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
	selectors: {
		core: {
			query: {
				startAnimation: ( { context } ) =>
					context.core.query.animation === 'start',
				finishAnimation: ( { context } ) =>
					context.core.query.animation === 'finish',
			},
		},
	},
	actions: {
		core: {
			query: {
				navigate: async ( { event, ref, context, state } ) => {
					if ( isValidLink( ref ) && isValidEvent( event ) ) {
						event.preventDefault();

						const id = ref.closest( '[data-wp-navigation-id]' )
							.dataset.wpNavigationId;

						// Don't announce the navigation immediately, wait 300 ms.
						const timeout = setTimeout( () => {
							context.core.query.message =
								state.core.query.loadingText;
							context.core.query.animation = 'start';
						}, 300 );

						await navigate( ref.href );

						// Dismiss loading message if it hasn't been added yet.
						clearTimeout( timeout );

						// Announce that the page has been loaded. If the message is the
						// same, we use a no-break space similar to the @wordpress/a11y
						// package: https://github.com/WordPress/gutenberg/blob/c395242b8e6ee20f8b06c199e4fc2920d7018af1/packages/a11y/src/filter-message.js#L20-L26
						context.core.query.message =
							state.core.query.loadedText +
							( context.core.query.message ===
							state.core.query.loadedText
								? '\u00A0'
								: '' );

						context.core.query.animation = 'finish';

						// Focus the first anchor of the Query block.
						document
							.querySelector(
								`[data-wp-navigation-id=${ id }] a[href]`
							)
							?.focus();
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
