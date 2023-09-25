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

const animationEnd = ( animationName, dom ) =>
	new Promise( ( resolve ) => {
		const handler = ( event ) => {
			if ( event.animationName === animationName ) {
				dom.removeEventListener( 'animationend', handler );
				dom.removeEventListener( 'animationcancel', handler );
				resolve();
			}
		};
		dom.addEventListener( 'animationend', handler );
		dom.addEventListener( 'animationcancel', handler );
	} );

const shouldReduceMotion = () =>
	window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

store( {
	selectors: {
		core: {
			query: {
				startAnimation: ( { context } ) =>
					context.core.query.animation === 'start',
				finishAnimation: ( { context } ) =>
					context.core.query.animation === 'finish',
				fadeOutPostTemplate: ( { context } ) =>
					context.core.query.postTemplateAnimation === 'fade-out',
				fadeInPostTemplate: ( { context } ) =>
					context.core.query.postTemplateAnimation === 'fade-in',
			},
		},
	},
	actions: {
		core: {
			query: {
				navigate: async ( { event, ref, context } ) => {
					if ( isValidLink( ref ) && isValidEvent( event ) ) {
						event.preventDefault();

						const region = ref.closest( '[data-wp-navigation-id]' );
						const id = region.dataset.wpNavigationId;

						// Don't announce the navigation immediately, wait 300 ms.
						const timeout = setTimeout( () => {
							context.core.query.message =
								context.core.query.loadingText;
							context.core.query.animation = 'start';
						}, 400 );

						const beforeRender = async () => {
							context.core.query.postTemplateAnimation =
								'fade-out';
							await animationEnd(
								'wp-block-post-template__fade-out',
								region
							);
						};

						await navigate( ref.href, { beforeRender } );
						context.core.query.postTemplateAnimation = 'fade-in';

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

						if ( shouldReduceMotion() ) {
							document.querySelector( firstAnchor )?.focus();
						} else {
							const { style } = document.scrollingElement;
							const prevScrollBehavior = style.scrollBehavior;

							style.scrollBehavior = 'smooth';
							document.querySelector( firstAnchor )?.focus();
							style.scrollBehavior = prevScrollBehavior;
						}
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
