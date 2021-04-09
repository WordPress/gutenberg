export default function onFilter( node ) {
	if ( ! node.getAttributeNames ) {
		return;
	}
	for ( const attributeName of node.getAttributeNames() ) {
		if ( attributeName.indexOf( 'on' ) === 0 ) {
			node.removeAttribute( attributeName );
		}
	}
}
