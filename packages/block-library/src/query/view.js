/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

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

store(
	'core/query',
	{
		actions: {
			*navigate( event ) {
				const ctx = getContext();
				const { ref } = getElement();
				const queryRef = ref.closest(
					'.wp-block-query[data-wp-router-region]'
				);

				if ( isValidLink( ref ) && isValidEvent( event ) ) {
					event.preventDefault();

					const { actions } = yield import(
						'@wordpress/interactivity-router'
					);
					yield actions.navigate( ref.href );
					ctx.url = ref.href;

					// Focus the first anchor of the Query block.
					const firstAnchor = `.wp-block-post-template a[href]`;
					queryRef.querySelector( firstAnchor )?.focus();
				}
			},
			*prefetch() {
				const { ref } = getElement();
				if ( isValidLink( ref ) ) {
					const { actions } = yield import(
						'@wordpress/interactivity-router'
					);
					yield actions.prefetch( ref.href );
				}
			},
		},
		callbacks: {
			*prefetch() {
				const { url } = getContext();
				const { ref } = getElement();
				if ( url && isValidLink( ref ) ) {
					const { actions } = yield import(
						'@wordpress/interactivity-router'
					);
					yield actions.prefetch( ref.href );
				}
			},
		},
	},
	{ lock: true }
);
