/**
 * Looks for comments, and removes them.
 *
 * @param node The node to be processed.
 */
export default function msListIgnore( node: Node ) {
	if ( node.nodeType !== node.ELEMENT_NODE ) {
		return;
	}

	const el = node as HTMLElement;
	const style = el.getAttribute( 'style' );

	if ( ! style || ! style.includes( 'mso-list' ) ) {
		return;
	}

	const rules = style.split( ';' ).reduce(
		( acc, rule ) => {
			const [ key, value ] = rule.split( ':' );

			if ( key && value ) {
				acc[ key.trim().toLowerCase() ] = value.trim().toLowerCase();
			}
			return acc;
		},
		{} as Record< string, string >
	);

	if ( rules[ 'mso-list' ] === 'ignore' ) {
		el.remove();
	}
}
