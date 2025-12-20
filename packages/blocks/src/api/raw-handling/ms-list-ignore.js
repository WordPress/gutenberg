/**
 * Looks for comments, and removes them.
 *
 * @param {Node} node The node to be processed.
 * @return {void}
 */
export default function msListIgnore( node ) {
	if ( node.nodeType !== node.ELEMENT_NODE ) {
		return;
	}

	const style = node.getAttribute( 'style' );

	if ( ! style || ! style.includes( 'mso-list' ) ) {
		return;
	}

	const rules = style.split( ';' ).reduce( ( acc, rule ) => {
		const [ key, value ] = rule.split( ':' );

		if ( key && value ) {
			acc[ key.trim().toLowerCase() ] = value.trim().toLowerCase();
		}
		return acc;
	}, {} );

	if ( rules[ 'mso-list' ] === 'ignore' ) {
		node.remove();
	}
}
