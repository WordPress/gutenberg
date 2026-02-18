/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Adds crossorigin and credentialless attributes to elements as needed.
 *
 * @param {Element} el The element to modify.
 */
function addCrossOriginAttributes( el ) {
	// Add the crossorigin attribute if missing.
	if ( ! el.hasAttribute( 'crossorigin' ) ) {
		el.setAttribute( 'crossorigin', 'anonymous' );
	}

	// For iframes, add the credentialless attribute.
	if ( el.nodeName === 'IFRAME' && ! el.hasAttribute( 'credentialless' ) ) {
		// Do not modify the iframed editor canvas.
		if ( el.getAttribute( 'src' )?.startsWith( 'blob:' ) ) {
			return;
		}

		el.setAttribute( 'credentialless', '' );

		// Reload the iframe to ensure the new attribute is taken into account.
		const origSrc = el.getAttribute( 'src' ) || '';
		el.setAttribute( 'src', '' );
		el.setAttribute( 'src', origSrc );
	}
}

// Only add the mutation observer if the site is cross-origin isolated.
if ( window.crossOriginIsolated ) {
	/*
	 * Detects dynamically added DOM nodes that are missing the `crossorigin` attribute.
	 */
	const observer = new window.MutationObserver( ( mutations ) => {
		mutations.forEach( ( mutation ) => {
			[ mutation.addedNodes, mutation.target ].forEach( ( value ) => {
				const nodes =
					value instanceof window.NodeList ? value : [ value ];
				nodes.forEach( ( node ) => {
					const el = node;

					if ( ! el.querySelectorAll ) {
						// Most likely a text node.
						return;
					}

					el.querySelectorAll(
						'img,source,script,video,link,iframe'
					).forEach( ( v ) => {
						addCrossOriginAttributes( v );
					} );

					if ( el.nodeName === 'IFRAME' ) {
						const iframeNode = el;

						/*
						 * Sandboxed iframes should not get modified. For example embedding a tweet served in a sandboxed
						 * iframe, the tweet itself would not be modified.
						 */
						const isEmbedSandboxIframe =
							iframeNode.classList.contains(
								'components-sandbox'
							);

						if ( ! isEmbedSandboxIframe ) {
							iframeNode.addEventListener( 'load', () => {
								try {
									if (
										iframeNode.contentDocument &&
										iframeNode.contentDocument.body
									) {
										observer.observe(
											iframeNode.contentDocument,
											{
												childList: true,
												attributes: true,
												subtree: true,
											}
										);
									}
								} catch ( e ) {
									// Iframe may be cross-origin or otherwise inaccessible.
									// Silently ignore these cases.
								}
							} );
						}
					}

					if (
						[
							'IMG',
							'SOURCE',
							'SCRIPT',
							'VIDEO',
							'LINK',
							'IFRAME',
						].includes( el.nodeName )
					) {
						addCrossOriginAttributes( el );
					}
				} );
			} );
		} );
	} );

	/**
	 * Start observing the document body, waiting for it to be available if needed.
	 */
	function startObservingBody() {
		if ( document.body ) {
			observer.observe( document.body, {
				childList: true,
				attributes: true,
				subtree: true,
			} );
		} else if ( document.readyState === 'loading' ) {
			// Wait for DOM to be ready.
			document.addEventListener( 'DOMContentLoaded', () => {
				if ( document.body ) {
					observer.observe( document.body, {
						childList: true,
						attributes: true,
						subtree: true,
					} );
				}
			} );
		}
	}

	startObservingBody();
}

// Only apply the embed preview filter when cross-origin isolated.
if ( window.crossOriginIsolated ) {
	const supportsCredentialless =
		'credentialless' in window.HTMLIFrameElement.prototype;

	const disableEmbedPreviews = createHigherOrderComponent(
		( BlockEdit ) =>
			function DisableEmbedPreviews( props ) {
				if ( 'core/embed' !== props.name ) {
					return <BlockEdit { ...props } />;
				}

				// List of embeds that do not support a preview is from packages/block-library/src/embed/variations.js.
				const previewable =
					supportsCredentialless &&
					! [ 'facebook', 'smugmug' ].includes(
						props.attributes.providerNameSlug
					);

				return (
					<BlockEdit
						{ ...props }
						attributes={ { ...props.attributes, previewable } }
					/>
				);
			},
		'withDisabledEmbedPreview'
	);

	addFilter(
		'editor.BlockEdit',
		'media-experiments/disable-embed-previews',
		disableEmbedPreviews
	);
}
