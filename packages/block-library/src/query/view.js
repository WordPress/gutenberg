/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	navigate,
	prefetch,
} from '@wordpress/interactivity';

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

store( 'core/query', {
	state: {
		get startAnimation() {
			return getContext().animation === 'start';
		},
		get finishAnimation() {
			return getContext().animation === 'finish';
		},
	},
	actions: {
		*navigate( event ) {
			const ctx = getContext();
			const { ref } = getElement();
			const isDisabled = ref.closest( '[data-wp-navigation-id]' )?.dataset
				.wpNavigationDisabled;

			if ( isValidLink( ref ) && isValidEvent( event ) && ! isDisabled ) {
				event.preventDefault();

				const id = ref.closest( '[data-wp-navigation-id]' ).dataset
					.wpNavigationId;

				// Don't announce the navigation immediately, wait 400 ms.
				const timeout = setTimeout( () => {
					ctx.message = ctx.loadingText;
					ctx.animation = 'start';
				}, 400 );

				yield navigate( ref.href );

				// Dismiss loading message if it hasn't been added yet.
				clearTimeout( timeout );

				// Announce that the page has been loaded. If the message is the
				// same, we use a no-break space similar to the @wordpress/a11y
				// package: https://github.com/WordPress/gutenberg/blob/c395242b8e6ee20f8b06c199e4fc2920d7018af1/packages/a11y/src/filter-message.js#L20-L26
				ctx.message =
					ctx.loadedText +
					( ctx.message === ctx.loadedText ? '\u00A0' : '' );

				ctx.animation = 'finish';
				ctx.url = ref.href;

				// Focus the first anchor of the Query block.
				const firstAnchor = `[data-wp-navigation-id=${ id }] .wp-block-post-template a[href]`;
				document.querySelector( firstAnchor )?.focus();
			}
		},
		*prefetch() {
			const { ref } = getElement();
			const isDisabled = ref.closest( '[data-wp-navigation-id]' )?.dataset
				.wpNavigationDisabled;
			if ( isValidLink( ref ) && ! isDisabled ) {
				yield prefetch( ref.href );
			}
		},
	},
	callbacks: {
		*prefetch() {
			const { url } = getContext();
			const { ref } = getElement();
			if ( url && isValidLink( ref ) ) {
				yield prefetch( ref.href );
			}
		},
	},
} );
