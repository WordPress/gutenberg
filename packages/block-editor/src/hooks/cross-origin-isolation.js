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
function addAttribute( el ) {
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

		el.setAttribute( 'credentialless', 'true' );

		// Reload the iframe to ensure the new attribute is taken into account.
		if ( ! el.hasAttribute( 'src' ) ) {
			el.setAttribute( 'src', '' );
		} else {
			const origSrc = el.getAttribute( 'src' );
			if ( origSrc ) {
				el.setAttribute( 'src', '' );
				el.setAttribute( 'src', origSrc );
			}
		}
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
						addAttribute( v );
					} );

					if ( el.nodeName === 'IFRAME' ) {
						const iframeNode = el;

						/*
						 * If for example embedding a tweet, it should be loaded
						 * in a credentialless iframe, but the tweet itself
						 * should not be modified.
						 */

						const isEmbedSandboxIframe =
							iframeNode.classList.contains(
								'components-sandbox'
							);

						if ( ! isEmbedSandboxIframe ) {
							iframeNode.addEventListener( 'load', () => {
								if ( iframeNode.contentDocument ) {
									observer.observe(
										iframeNode.contentDocument,
										{
											childList: true,
											attributes: true,
											subtree: true,
										}
									);
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
						addAttribute( el );
					}
				} );
			} );
		} );
	} );

	observer.observe( document.body, {
		childList: true,
		attributes: true,
		subtree: true,
	} );
}

const supportsCredentialless =
	window.crossOriginIsolated &&
	'credentialless' in window.HTMLIFrameElement.prototype;

const disableEmbedPreviews = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( 'core/embed' !== props.name ) {
			return <BlockEdit { ...props } />;
		}

		// Denylist taken from packages/block-library/src/embed/variations.js in Gutenberg.
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
