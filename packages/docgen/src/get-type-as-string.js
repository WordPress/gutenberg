const { parse } = require( 'jsdoctypeparser' );

const getType = ( ast, typeString, noUnionParenthesis ) => {
	if ( ast.type === 'NAME' ) {
		return ast.name;
	}

	if ( ast.type === 'ANY' ) {
		return '*';
	}

	if ( ast.type === 'GENERIC' ) {
		const types = ast.objects.map( ( o ) => getType( o ) ).join( ',' );
		return `${ getType( ast.subject ) }<${ types }>`;
	}

	if ( ast.type === 'NULLABLE' ) {
		return `?${ getType( ast.value ) }`;
	}

	if ( ast.type === 'VARIADIC' ) {
		return `...${ getType( ast.value ) }`;
	}

	if ( ast.type === 'UNION' ) {
		const left = getType( ast.left );
		const right = getType( ast.right, null, true );
		const type = `${ left }|${ right }`;

		return noUnionParenthesis ? type : `(${ type })`;
	}

	if ( ast.type === 'PARENTHESIS' ) {
		const type = getType( ast.value );
		return type[ 0 ] === '(' && type[ type.length - 1 ] === ')'
			? type
			: `(${ type })`;
	}

	if ( ast.type === 'OPTIONAL' ) {
		return `[${ getType( ast.value ) }]`;
	}

	return typeString || 'unknown type';
};

module.exports = function( typeString, optional ) {
	let ast;

	try {
		ast = parse( typeString );
	} catch {
		return 'unknown type';
	}

	const type = getType( ast, typeString );

	return optional ? `[${ type }]` : type;
};
