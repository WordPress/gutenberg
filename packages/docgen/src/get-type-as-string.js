const maybeAddDefault = function( value, defaultValue ) {
	if ( defaultValue ) {
		return `value=${ defaultValue }`;
	}
	return value;
};

const getType = function( param, defaultValue ) {
	if ( ! defaultValue ) {
		defaultValue = param.default;
	}

	if ( param.type.type ) {
		return getType( param.type, defaultValue );
	} else if ( param.expression ) {
		if ( param.type === 'RestType' ) {
			return `...${ getType( param.expression, defaultValue ) }`;
		} else if ( param.type === 'NullableType' ) {
			return `?${ getType( param.expression, defaultValue ) }`;
		} else if ( param.type === 'TypeApplication' ) {
			return `${ getType( param.expression, defaultValue ) }<${
				param.applications.map( ( application ) => getType( application ) ).join( ',' )
			}>`;
		} else if ( param.type === 'OptionalType' ) {
			return `[${ getType( param.expression, defaultValue ) }]`;
		}
		return getType( param.expression, defaultValue );
	} else if ( param.elements ) {
		const types = param.elements.map( ( element ) => getType( element ) );
		return maybeAddDefault( `(${ types.join( '|' ) })`, defaultValue );
	} else if ( param.type === 'AllLiteral' ) {
		return maybeAddDefault( '*', defaultValue );
	} else if ( param.type === 'NullLiteral' ) {
		return maybeAddDefault( 'null', defaultValue );
	} else if ( param.type === 'UndefinedLiteral' ) {
		return maybeAddDefault( 'undefined', defaultValue );
	}

	return maybeAddDefault( param.name, defaultValue );
};

module.exports = function( param ) {
	return getType( param );
};
