const getNodeText = ( node: React.ReactNode ): string => {
	if ( node === null ) {
		return '';
	}

	switch ( typeof node ) {
		case 'string':
		case 'number':
			return node.toString();
		case 'object': {
			if ( node instanceof Array ) {
				return node.map( getNodeText ).join( '' );
			}
			if ( 'props' in node ) {
				return getNodeText( node.props.children );
			}
			return '';
		}
		default:
			return '';
	}
};

export default getNodeText;
