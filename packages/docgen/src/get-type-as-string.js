const getType = function( param ) {
	if ( param.type.type ) {
		return getType( param.type );
	} else if ( param.expression ) {
		if ( param.type === 'RestType' ) {
			return `...${ getType( param.expression ) }`;
		} else if ( param.type === 'NullableType' ) {
			return `?${ getType( param.expression ) }`;
		} else if ( param.type === 'TypeApplication' ) {
			return `${ getType( param.expression ) }<${
				param.applications.map( ( application ) => getType( application ) ).join( ',' )
			}>`;
		} else if ( param.type === 'OptionalType' ) {
			return `[${ getType( param.expression ) }]`;
		}
		return getType( param.expression );
	} else if ( param.elements ) {
		const types = param.elements.map( ( element ) => getType( element ) );
		return `(${ types.join( '|' ) })`;
	} else if ( param.type === 'AllLiteral' ) {
		return '*';
	} else if ( param.type === 'NullLiteral' ) {
		return 'null';
	} else if ( param.type === 'UndefinedLiteral' ) {
		return 'undefined';
	}

	return param.name;
};

module.exports = function( param ) {
	return getType( param );
};
