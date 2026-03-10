/**
 * Adds crossorigin="anonymous" to an element if missing.
 *
 * @param {Element} el The element to modify.
 */
function addCrossOriginAttribute( el ) {
	if ( ! el.hasAttribute( 'crossorigin' ) ) {
		el.setAttribute( 'crossorigin', 'anonymous' );
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
						'img,source,script,video,link'
					).forEach( ( v ) => {
						addCrossOriginAttribute( v );
					} );

					if (
						[ 'IMG', 'SOURCE', 'SCRIPT', 'VIDEO', 'LINK' ].includes(
							el.nodeName
						)
					) {
						addCrossOriginAttribute( el );
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
