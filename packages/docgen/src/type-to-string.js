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

	if ( type.typeName.kind === SyntaxKind.QualifiedName ) {
		const name = type.typeName;

		return `${ name.left.escapedText }.${ name.right.escapedText }`;
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

const getFunctionType = ( type ) => {
	const params = type.parameters
		.map( ( p ) => {
			const dots = p.dotDotDotToken ? '...' : '';
			const typeName = typeToString( p.type );

			return `${ dots }${ p.name.escapedText }: ${ typeName }`;
		} )
		.join( ', ' );

	return `(${ params }) => ${ typeToString( type.type ) }`;
};

const getFunctionTypeFromJSDocFunctionType = ( type ) => {
	const params = type.parameters
		.map( ( p, i ) => `p${ i }: ${ typeToString( p.type ) }` )
		.join( ', ' );

	return `(${ params }) => ${ typeToString( type.type ) }`;
};

const getTypeLiteral = ( type ) => {
	const properties = type.members
		.map( ( m ) => {
			if ( m.kind === SyntaxKind.PropertySignature ) {
				return `${ m.name.escapedText }: ${ typeToString( m.type ) }`;
			}

			// m.kind === SyntaxKind.IndexSignature
			const param = m.parameters[ 0 ];
			return `[${ param.name.escapedText }: ${ typeToString(
				param.type
			) }]: ${ typeToString( m.type ) }`;
		} )
		.join( ', ' );

	return `{ ${ properties } }`;
};

const getTypeOperator = ( type ) => {
	if ( type.operator === SyntaxKind.KeyOfKeyword ) {
		return `keyof ${ typeToString( type.type ) }`;
	}

	if ( type.operator === SyntaxKind.ReadonlyKeyword ) {
		return `readonly ${ typeToString( type.type ) }`;
	}

	// type.operator === SyntaxKind.UniqueKeyword
	return `unique ${ typeToString( type.type ) }`;
};

const getIndexedAccessType = ( { objectType, indexType } ) => {
	return `${ typeToString( objectType ) }[${ typeToString( indexType ) }]`;
};

const getMappedType = ( type ) => {
	const readonly = type.readonlyToken ? 'readonly ' : '';
	const paramTypeName = type.typeParameter.name.escapedText;
	const constraint = typeToString( type.typeParameter.constraint );
	const question = type.questionToken ? '?' : '';
	const typeName = typeToString( type.type );

	return `{ ${ readonly }[${ paramTypeName } in ${ constraint }]${ question }: ${ typeName } }`;
};

const getConditionalType = ( {
	checkType,
	extendsType,
	trueType,
	falseType,
} ) => {
	const checkName = typeToString( checkType );
	const extendsName = typeToString(
		extendsType.kind === SyntaxKind.JSDocNullableType
			? extendsType.type
			: extendsType
	);
	const trueName = typeToString( trueType );
	const falseName = typeToString( falseType );

	return `${ checkName } extends ${ extendsName } ? ${ trueName } : ${ falseName }`;
};

const getImportType = ( { argument, qualifier } ) => {
	const argumentName = typeToString( argument );
	const qualifierName = qualifier.escapedText;

	return `import(${ argumentName }).${ qualifierName }`;
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
		case SyntaxKind.JSDocTypeLiteral:
			return 'object';
		case SyntaxKind.VoidKeyword:
			return 'void';
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
		case SyntaxKind.FunctionType:
			return getFunctionType( type );
		case SyntaxKind.ConstructorType:
			return `new ${ getFunctionType( type ) }`;
		case SyntaxKind.JSDocFunctionType:
			return getFunctionTypeFromJSDocFunctionType( type );
		case SyntaxKind.TypeLiteral:
			return getTypeLiteral( type );
		case SyntaxKind.TypeOperator:
			return getTypeOperator( type );
		case SyntaxKind.IndexedAccessType:
			return getIndexedAccessType( type );
		case SyntaxKind.MappedType:
			return getMappedType( type );
		case SyntaxKind.ConditionalType:
			return getConditionalType( type );
		case SyntaxKind.InferType:
			return `infer ${ type.typeParameter.name.escapedText }`;
		case SyntaxKind.ImportType:
			return getImportType( type );
	}
};

module.exports = typeToString;
