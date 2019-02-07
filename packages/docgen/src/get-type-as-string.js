const getType = function( param ) {
	if ( param.type.type ) {
		return getType( param.type );
	} else if ( param.expression ) {
		if ( param.type === 'RestType' ) {
			return `...${ getType( param.expression ) }`;
		} else if ( param.type === 'NullableType' ) {
			return `?${ getType( param.expression ) }`;
		}
		return getType( param.expression );
	} else if ( param.elements ) {
		const types = param.elements.map( ( element ) => getType( element ) );
		return `(${ types.join( '|' ) })`;
	} else if ( param.type === 'AllLiteral' ) {
		return '*';
	}

	return param.name;
};

module.exports = function( param ) {
	return getType( param );
};
