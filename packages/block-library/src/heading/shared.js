/**
 * Given a node name string for a heading node, returns its numeric level.
 *
 * @param {string} nodeName Heading node name.
 *
 * @return {number} Heading level.
 */
export function getLevelFromHeadingNodeName( nodeName ) {
	return Number( nodeName.substr( 1 ) );
}
