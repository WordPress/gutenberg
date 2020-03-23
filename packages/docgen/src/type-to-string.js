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

		return name;
	}
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
	}
};

module.exports = typeToString;
