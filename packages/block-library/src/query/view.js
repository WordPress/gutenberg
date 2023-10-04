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
	event.button === 0 && // Left clicks only.
	! event.metaKey && // Open in new tab (Mac).
	! event.ctrlKey && // Open in new tab (Windows).
	! event.altKey && // Download.
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
				navigate: async ( { event, ref, context } ) => {
					if ( isValidLink( ref ) && isValidEvent( event ) ) {
						event.preventDefault();

						const id = ref.closest( '[data-wp-navigation-id]' )
							.dataset.wpNavigationId;

						// Don't announce the navigation immediately, wait 400 ms.
						const timeout = setTimeout( () => {
							context.core.query.message =
								context.core.query.loadingText;
							context.core.query.animation = 'start';
						}, 400 );

						await navigate( ref.href );

						// Dismiss loading message if it hasn't been added yet.
						clearTimeout( timeout );

						// Announce that the page has been loaded. If the message is the
						// same, we use a no-break space similar to the @wordpress/a11y
						// package: https://github.com/WordPress/gutenberg/blob/c395242b8e6ee20f8b06c199e4fc2920d7018af1/packages/a11y/src/filter-message.js#L20-L26
						context.core.query.message =
							context.core.query.loadedText +
							( context.core.query.message ===
							context.core.query.loadedText
								? '\u00A0'
								: '' );

						context.core.query.animation = 'finish';
						context.core.query.url = ref.href;

						// Focus the first anchor of the Query block.
						const firstAnchor = `[data-wp-navigation-id=${ id }] .wp-block-post-template a[href]`;
						document.querySelector( firstAnchor )?.focus();
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
	effects: {
		core: {
			query: {
				prefetch: async ( { ref, context } ) => {
					if ( context.core.query.url && isValidLink( ref ) ) {
						await prefetch( ref.href );
					}
				},
			},
		},
	},
} );
