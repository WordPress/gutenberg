/**
 * Tables are breaking Gutenberg on paste. Initial quick solution is to remove
 * them, until we can come up with a happier result
 *
 * @param {Array} nodes DOM nodes pasted
 * @return {Array} Same nodes, just without tables
 */
export default function( nodes ) {
	return nodes.filter( node => 'TABLE' !== node.nodeName );
}
