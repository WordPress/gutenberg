/**
 * Removes the charset meta tag inserted by Chromium, along with any other ones.
 * See:
 * - https://github.com/WordPress/gutenberg/issues/33585
 * - https://bugs.chromium.org/p/chromium/issues/detail?id=1264616#c4
 *
 * @param {Node} node The node to be processed.
 */
export default function metaRemover( node ) {
	if ( node.nodeName === 'META' ) {
		node.remove();
	}
}
