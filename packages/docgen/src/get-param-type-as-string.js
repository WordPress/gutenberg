const getType = function( param ) {
	if ( param.type.expression ) {
		return getType( param.type.expression );
	} else if ( param.type.type === 'NameExpression' ) {
		return getType( param.type );
	}

	return param.name;
};

module.exports = function( param ) {
	return getType( param );
};
