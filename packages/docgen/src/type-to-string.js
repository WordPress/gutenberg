/**
 * External dependencies
 */
import { SyntaxKind } from 'typescript';

const getTypeFromTypeReference = ( type ) => {
	if ( type.typeName.kind === SyntaxKind.Identifier ) {
		const name = type.typeName.escapedText;

		if ( name === 'String' || name === 'Number' ) {
			return name.toLowerCase();
		}

		if ( name === 'Object' ) {
			const args = type.typeArguments;

			if ( args && args.length === 2 ) {
				const arg0 = typeToString( args[ 0 ] );
				const arg1 = typeToString( args[ 1 ] );

				return `Record<${ arg0 }, ${ arg1 }>`;
			}

			return 'object';
		}

		if ( name === 'Array' ) {
			const args = type.typeArguments;

			if ( args && args.length === 1 ) {
				return getArrayType( typeToString( args[ 0 ] ) );
			}

			return 'Array';
		}

		return name;
	}
};

const getTypeFromLiteral = ( { literal } ) => {
	if ( literal.kind === SyntaxKind.StringLiteral ) {
		return `'${ literal.text }'`;
	} else if ( literal.kind === SyntaxKind.NumericLiteral ) {
		return `${ literal.text }`;
	} else if ( literal.kind === SyntaxKind.TrueKeyword ) {
		return 'true';
	} else if ( literal.kind === SyntaxKind.FalseKeyword ) {
		return 'false';
	}
};

const getArrayType = ( elementTypeName ) => {
	return `${ elementTypeName }[]`;
};

const getTupleType = ( elementTypes ) => {
	const str = elementTypes
		.map( ( type ) => {
			if ( type.kind === SyntaxKind.JSDocNullableType ) {
				type.kind = SyntaxKind.OptionalType;
			}

			return typeToString( type );
		} )
		.join( ', ' );

	return `[${ str }]`;
};

const typeToString = ( type ) => {
	switch ( type.kind ) {
		case SyntaxKind.AnyKeyword:
		case SyntaxKind.JSDocAllType:
			return 'any';
		case SyntaxKind.JSDocUnknownType:
		case SyntaxKind.UnknownKeyword:
			return 'unknown';
		case SyntaxKind.StringKeyword:
			return 'string';
		case SyntaxKind.NumberKeyword:
			return 'number';
		case SyntaxKind.BigIntKeyword:
			return 'bigint';
		case SyntaxKind.BooleanKeyword:
			return 'boolean';
		case SyntaxKind.SymbolKeyword:
			return 'symbol';
		case SyntaxKind.UndefinedKeyword:
			return 'undefined';
		case SyntaxKind.NullKeyword:
			return 'null';
		case SyntaxKind.NeverKeyword:
			return 'never';
		case SyntaxKind.ObjectKeyword:
			return 'object';
		case SyntaxKind.TypeReference:
			return getTypeFromTypeReference( type );
		case SyntaxKind.LiteralType:
			return getTypeFromLiteral( type );
		case SyntaxKind.TypeQuery:
			return `typeof ${ type.exprName.escapedText }`;
		case SyntaxKind.ArrayType:
			return getArrayType( typeToString( type.elementType ) );
		case SyntaxKind.TupleType:
			return getTupleType( type.elementTypes );
		case SyntaxKind.JSDocNullableType:
			return `${ typeToString( type.type ) } | null`;
		case SyntaxKind.OptionalType:
			return `${ typeToString( type.type ) }?`;
		case SyntaxKind.UnionType:
			return type.types
				.map( ( t ) => {
					if ( t.kind === SyntaxKind.IntersectionType ) {
						return `( ${ typeToString( t ) } )`;
					}
					return typeToString( t );
				} )
				.join( ' | ' );
		case SyntaxKind.IntersectionType:
			return type.types
				.map( ( t ) => {
					return typeToString( t );
				} )
				.join( ' & ' );
		case SyntaxKind.JSDocOptionalType:
			return `${ typeToString( type.type ) } | undefined`;
		case SyntaxKind.ParenthesizedType:
			return `( ${ typeToString( type.type ) } )`;
		case SyntaxKind.JSDocNonNullableType:
			return typeToString( type.type );
		case SyntaxKind.RestType:
		case SyntaxKind.JSDocVariadicType:
			return `...${ typeToString( type.type ) }`;
	}
};

module.exports = typeToString;
