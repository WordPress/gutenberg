/**
 * External dependencies
 */
// See https://babeljs.io/docs/en/babel-types.
const { types: babelTypes } = require( '@babel/core' );

/* eslint-disable jsdoc/valid-types */
/** @typedef {ReturnType<import('comment-parser').parse>[0]} CommentBlock */
/** @typedef {CommentBlock['tags'][0]} CommentTag */
/** @typedef {babelTypes.TSType} TypeAnnotation */
/** @typedef {babelTypes.TSCallSignatureDeclaration | babelTypes.TSFunctionType | babelTypes.TSConstructSignatureDeclaration} ExtendedTypeAnnotation */
/** @typedef {import('@babel/core').Node} ASTNode */
/* eslint-enable jsdoc/valid-types */

/**
 * @param {ExtendedTypeAnnotation} typeAnnotation
 * @param {' => ' | ': '}          returnIndicator The return indicator to use. Allows using the same function for function annotations and object call properties.
 */
function getFunctionTypeAnnotation( typeAnnotation, returnIndicator ) {
	const nonRestParams = typeAnnotation.parameters
		.filter( ( p ) => babelTypes.isIdentifier( p ) )
		.map(
			( p ) =>
				`${ p.name }: ${ getTypeAnnotation(
					p.typeAnnotation.typeAnnotation
				) }`
		)
		.join( ', ' );

	let params = nonRestParams;
	const restParam = typeAnnotation.parameters.find(
		babelTypes.isRestElement
	);
	if ( restParam ) {
		const paramName = restParam.argument.name;
		const paramType = getTypeAnnotation(
			restParam.typeAnnotation.typeAnnotation
		);
		params += `, ...${ paramName }: ${ paramType }`;
	}

	const returnType = getTypeAnnotation(
		typeAnnotation.returnType ||
			typeAnnotation.typeAnnotation.typeAnnotation
	);

	const paramsWithParens = params.length ? `( ${ params } )` : `()`;

	return `${ paramsWithParens }${ returnIndicator }${ returnType }`;
}

/**
 * @param {babelTypes.TSTypeLiteral} typeAnnotation
 */
function getTypeLiteralCallSignatureDeclarationTypeAnnotations(
	typeAnnotation
) {
	const callProperties = typeAnnotation.members
		.filter( ( m ) => babelTypes.isTSCallSignatureDeclaration( m ) )
		.map( ( callProperty ) => {
			return getFunctionTypeAnnotation( callProperty, ': ' );
		} );

	if ( callProperties.length ) {
		return `${ callProperties.join( '; ' ) }; `;
	}
	return '';
}

/**
 * @param {babelTypes.TSTypeLiteral} typeAnnotation
 */
function getTypeLiteralIndexSignatureTypeAnnotations( typeAnnotation ) {
	const indexers = typeAnnotation.members
		.filter( ( m ) => babelTypes.isTSIndexSignature( m ) )
		.map( ( indexer ) => {
			const parameter = indexer.parameters[ 0 ];
			return `[ ${ parameter.name }: ${ getTypeAnnotation(
				parameter.typeAnnotation.typeAnnotation
			) } ]: ${ getTypeAnnotation(
				indexer.typeAnnotation.typeAnnotation
			) }`;
		} );

	if ( indexers.length ) {
		return `${ indexers.join( '; ' ) }; `;
	}
	return '';
}

/**
 * @param {babelTypes.TSTypeLiteral} typeAnnotation
 */
function getTypeLiteralPropertyTypeAnnotations( typeAnnotation ) {
	const properties = typeAnnotation.members
		.filter( ( m ) => babelTypes.isTSPropertySignature( m ) )
		.map( ( prop ) => {
			return `${ prop.key.name }${
				prop.optional ? '?' : ''
			}: ${ getTypeAnnotation( prop.typeAnnotation.typeAnnotation ) }`;
		} );

	if ( properties.length ) {
		return `${ properties.join( '; ' ) }; `;
	}
	return '';
}

/**
 * @param {babelTypes.TSTypeLiteral} typeAnnotation
 */
function getTypeLiteralTypeAnnotation( typeAnnotation ) {
	const callProperties =
		getTypeLiteralCallSignatureDeclarationTypeAnnotations( typeAnnotation );
	const indexers =
		getTypeLiteralIndexSignatureTypeAnnotations( typeAnnotation );
	const properties = getTypeLiteralPropertyTypeAnnotations( typeAnnotation );

	return `{ ${ callProperties }${ properties }${ indexers }}`;
}

/**
 * @param {babelTypes.TSUnionType} typeAnnotation
 */
function getUnionTypeAnnotation( typeAnnotation ) {
	return typeAnnotation.types.map( getTypeAnnotation ).join( ' | ' );
}

/**
 * @param {babelTypes.TSIntersectionType} typeAnnotation
 */
function getIntersectionTypeAnnotation( typeAnnotation ) {
	return typeAnnotation.types.map( getTypeAnnotation ).join( ' & ' );
}

/**
 * @param {babelTypes.TSArrayType} typeAnnotation
 * @return {string} The type annotation
 */
function getArrayTypeAnnotation( typeAnnotation ) {
	return `${ getTypeAnnotation( typeAnnotation.elementType ) }[]`;
}

/**
 * @param {babelTypes.TSTupleType} typeAnnotation
 */
function getTupleTypeAnnotation( typeAnnotation ) {
	const types = typeAnnotation.elementTypes
		.map( getTypeAnnotation )
		.join( ', ' );
	if ( types.length ) {
		return `[ ${ types } ]`;
	}
	return '[]';
}

/**
 * @param {babelTypes.TSQualifiedName} qualifiedName
 */
function unifyQualifiedName( qualifiedName ) {
	if ( ! qualifiedName.right ) {
		if ( ! qualifiedName.left ) {
			return qualifiedName.name;
		}
		return qualifiedName.left.name;
	}
	return `${ unifyQualifiedName( qualifiedName.left ) }.${
		qualifiedName.right.name
	}`;
}

/**
 * @param {babelTypes.TSImportType} typeAnnotation
 */
function getImportTypeAnnotation( typeAnnotation ) {
	// Should this just return the unqualified name (i.e., typeAnnotation.name || typeAnnotation.right.name)?
	return `import( '${
		typeAnnotation.argument.value
	}' ).${ unifyQualifiedName( typeAnnotation.qualifier ) }`;
}

/**
 *
 * @param {babelTypes.TSType} objectType
 */
function getIndexedAccessTypeAnnotationObjectName( objectType ) {
	if ( babelTypes.isTSImportType( objectType ) ) {
		return getImportTypeAnnotation( objectType );
	}
	return objectType.typeName.name;
}

/**
 * @param {babelTypes.TSIndexedAccessType} typeAnnotation
 */
function getIndexedAccessTypeAnnotation( typeAnnotation ) {
	const objName = getIndexedAccessTypeAnnotationObjectName(
		typeAnnotation.objectType
	);
	const index = typeAnnotation.indexType.literal.value;
	return `${ objName }[ '${ index }' ]`;
}

/**
 *
 * @param {babelTypes.TSLiteralType} typeAnnotation
 */
function getLiteralTypeAnnotation( typeAnnotation ) {
	switch ( typeAnnotation.literal.type ) {
		case 'BigIntLiteral': {
			return `${ typeAnnotation.literal.value }n`;
		}
		case 'NumericLiteral':
		case 'BooleanLiteral': {
			return typeAnnotation.literal.value.toString();
		}
		case 'StringLiteral': {
			return `'${ typeAnnotation.literal.value }'`;
		}
	}
}

/**
 * @param {babelTypes.TSMappedType} typeAnnotation
 */
function getMappedTypeAnnotation( typeAnnotation ) {
	const typeParam = typeAnnotation.typeParameter.name;
	const constraintOperator = typeAnnotation.typeParameter.constraint.operator;
	const constraintAnnotation = getTypeAnnotation(
		typeAnnotation.typeParameter.constraint.typeAnnotation
	);
	const mappedValue = getTypeAnnotation( typeAnnotation.typeAnnotation );
	return `[ ${ typeParam } in ${ constraintOperator } ${ constraintAnnotation } ]: ${ mappedValue }`;
}

/**
 * @param {babelTypes.TSTypeReference} typeAnnotation
 */
function getTypeReferenceTypeAnnotation( typeAnnotation ) {
	let typeName;
	if ( babelTypes.isTSQualifiedName( typeAnnotation.typeName ) ) {
		typeName = unifyQualifiedName( typeAnnotation.typeName );
	} else {
		typeName = typeAnnotation.typeName.name;
	}

	if ( typeAnnotation.typeParameters ) {
		const typeParams = typeAnnotation.typeParameters.params
			.map( getTypeAnnotation )
			.join( ', ' );
		typeName = `${ typeName }< ${ typeParams } >`;
	}
	return typeName;
}

/**
 * @param {TypeAnnotation} typeAnnotation
 * @return {string | null} The type or null if not an identifiable type.
 */
function getTypeAnnotation( typeAnnotation ) {
	switch ( typeAnnotation.type ) {
		case 'TSAnyKeyword': {
			return 'any';
		}
		case 'TSArrayType': {
			return getArrayTypeAnnotation( typeAnnotation );
		}
		case 'TSBigIntKeyword': {
			return 'BigInt';
		}
		case 'TSBooleanKeyword': {
			return 'boolean';
		}
		case 'TSConditionalType': {
			// Unsure what this is.
			return '';
		}
		case 'TSConstructorType': {
			return `new ${ getFunctionTypeAnnotation( typeAnnotation, ': ' ) }`;
		}
		case 'TSExpressionWithTypeArguments': {
			// Unsure with this is.
			return '';
		}
		case 'TSFunctionType': {
			return getFunctionTypeAnnotation( typeAnnotation, ' => ' );
		}
		case 'TSImportType': {
			return getImportTypeAnnotation( typeAnnotation );
		}
		case 'TSIndexedAccessType': {
			return getIndexedAccessTypeAnnotation( typeAnnotation );
		}
		case 'TSIntersectionType': {
			return getIntersectionTypeAnnotation( typeAnnotation );
		}
		case 'TSLiteralType': {
			return getLiteralTypeAnnotation( typeAnnotation );
		}
		case 'TSMappedType': {
			return getMappedTypeAnnotation( typeAnnotation );
		}
		case 'TSNeverKeyword': {
			return 'never';
		}
		case 'TSNullKeyword': {
			return 'null';
		}
		case 'TSNumberKeyword': {
			return 'number';
		}
		case 'TSObjectKeyword': {
			return 'object';
		}
		case 'TSOptionalType': {
			return `${ getTypeAnnotation( typeAnnotation.typeAnnotation ) }?`;
		}
		case 'TSParenthesizedType': {
			return `( ${ getTypeAnnotation(
				typeAnnotation.typeAnnotation
			) } )`;
		}
		case 'TSRestType': {
			return `...${ getTypeAnnotation( typeAnnotation.typeAnnotation ) }`;
		}
		case 'TSStringKeyword': {
			return 'string';
		}
		case 'TSSymbolKeyword': {
			return 'symbol';
		}
		case 'TSThisType': {
			return 'this';
		}
		case 'TSTupleType': {
			return getTupleTypeAnnotation( typeAnnotation );
		}
		case 'TSTypeLiteral': {
			return getTypeLiteralTypeAnnotation( typeAnnotation );
		}
		case 'TSTypeOperator': {
			return `${ typeAnnotation.operator } ${ getTypeAnnotation(
				typeAnnotation.typeAnnotation
			) }`;
		}
		case 'TSTypePredicate': {
			return `${
				typeAnnotation.parameterName.name
			} is ${ getTypeAnnotation(
				typeAnnotation.typeAnnotation.typeAnnotation
			) }`;
		}
		case 'TSTypeQuery': {
			// Unsure what this is.
			return '';
		}
		case 'TSTypeReference': {
			return getTypeReferenceTypeAnnotation( typeAnnotation );
		}
		case 'TSUndefinedKeyword': {
			return 'undefined';
		}
		case 'TSUnionType': {
			return getUnionTypeAnnotation( typeAnnotation );
		}
		case 'TSUnknownKeyword': {
			return 'unknown';
		}
		case 'TSVoidKeyword': {
			return 'void';
		}
		default: {
			return '';
		}
	}
}

/**
 * Extract wrapped selector functions to reach inside for parameter types.
 *
 * This function wasn't necessary until we started introducing more TypeScript code into
 * the project. With parameter types fully in the JSDoc comments we always have a direct
 * match between parameter name and the type. However, when working in TypeScript where
 * we rely on the type annotations for the types we introduce a mismatch when wrapping
 * functions.
 *
 * Example:
 *     export const getThings = createSelector( ( state ) => state.things, ( state ) => state.version );
 *
 * In this example we would document `state` but its type is buried inside of `createSelector`.
 * Because this kind of scenario is tricky to properly parse without asking TypeScript directly
 * to give us the actual type of `getThings` we're going to special-case the known instances
 * of selector-wrapping to extract the inner function and re-connect the parameter types
 * with their descriptions in the JSDoc comments.
 *
 * If we find more wrapper functions on selectors we should add them below following the
 * example of `createSelector` and `createRegsitrySelector`.
 *
 * @param {ASTNode} token Contains either a function or a call to a function-wrapper.
 *
 *                        TODO: Remove the special-casing here once we're able to infer the types from TypeScript itself.
 */
function unwrapWrappedSelectors( token ) {
	if ( babelTypes.isTSDeclareFunction( token ) ) {
		return token;
	}

	if ( babelTypes.isFunctionDeclaration( token ) ) {
		return token;
	}

	if ( babelTypes.isFunctionExpression( token ) ) {
		return token;
	}

	if ( babelTypes.isArrowFunctionExpression( token ) ) {
		return token;
	}

	if ( babelTypes.isTSAsExpression( token ) ) {
		// ( ( state, queryId ) => state.queries[ queryId ] ) as any;
		// \------------------------------------------------/ CallExpression.expression
		return unwrapWrappedSelectors( token.expression );
	}

	if ( babelTypes.isCallExpression( token ) ) {
		// createSelector( ( state, queryId ) => state.queries[ queryId ] );
		//                 \--------------------------------------------/ CallExpression.arguments[0]
		if ( token.callee.name === 'createSelector' ) {
			return unwrapWrappedSelectors( token.arguments[ 0 ] );
		}

		// createRegistrySelector( ( selector ) => ( state, queryId ) => select( 'core/queries' ).get( queryId ) );
		//                                         \-----------------------------------------------------------/ CallExpression.arguments[0].body
		//                         \---------------------------------------------------------------------------/ CallExpression.arguments[0]
		if ( token.callee.name === 'createRegistrySelector' ) {
			return unwrapWrappedSelectors( token.arguments[ 0 ].body );
		}
	}
}

/**
 * @param {ASTNode} token
 * @return {babelTypes.ArrowFunctionExpression | babelTypes.FunctionDeclaration | babelTypes.FunctionExpression} The function token.
 */
function getFunctionToken( token ) {
	let resolvedToken = token;
	if ( babelTypes.isExportDefaultDeclaration( resolvedToken ) ) {
		resolvedToken = resolvedToken.declaration;
	}

	if ( babelTypes.isExportNamedDeclaration( resolvedToken ) ) {
		resolvedToken = resolvedToken.declaration;
	}

	if ( babelTypes.isVariableDeclaration( resolvedToken ) ) {
		// Ignore multiple variable declarations.
		resolvedToken = resolvedToken.declarations[ 0 ].init;
	}

	return unwrapWrappedSelectors( resolvedToken );
}

function getFunctionNameForError( declarationToken ) {
	let namedFunctionToken = declarationToken;
	if (
		babelTypes.isExportNamedDeclaration( declarationToken ) ||
		babelTypes.isExportDefaultDeclaration( declarationToken )
	) {
		namedFunctionToken = declarationToken.declaration;
	}

	if ( babelTypes.isVariableDeclaration( namedFunctionToken ) ) {
		namedFunctionToken = namedFunctionToken.declarations[ 0 ];
	}

	return namedFunctionToken.id.name;
}

function getArrayTagNamePosition( tag ) {
	return parseInt( tag.name.split( '.' ).slice( -1 )[ 0 ], 0 );
}

function getQualifiedArrayPatternTypeAnnotation( tag, paramType ) {
	if ( babelTypes.isTSArrayType( paramType ) ) {
		if ( babelTypes.isTSTypeReference( paramType.elementType ) ) {
			// Just get the element type for the array.
			return paramType.elementType.typeName.name;
		}
		return getTypeAnnotation( paramType.elementType.typeAnnotation );
	} else if ( babelTypes.isTSTupleType( paramType ) ) {
		return getTypeAnnotation(
			paramType.elementTypes[ getArrayTagNamePosition( tag ) ]
		);
	}

	// Anything else, `Alias[ position ]`.
	return `( ${ getTypeAnnotation( paramType ) } )[ ${ getArrayTagNamePosition(
		tag
	) } ]`;
}

function getQualifiedObjectPatternTypeAnnotation( tag, paramType ) {
	const memberName = tag.name.split( '.' ).slice( -1 )[ 0 ];
	if ( babelTypes.isTSTypeLiteral( paramType ) ) {
		// If it's a type literal we can try to find the member on the type.
		const member = paramType.members.find(
			( m ) => m.key.name === memberName
		);
		if ( member !== undefined ) {
			return getTypeAnnotation( member.typeAnnotation.typeAnnotation );
		}
	}
	// If we couldn't find a specific member for the type then we'll just return something like `Type[ memberName ]` to indicate the parameter is a member of that type.
	const typeAnnotation = getTypeAnnotation( paramType );
	return `${ typeAnnotation }[ '${ memberName }' ]`;
}

/**
 * @param {CommentTag} tag              The documented parameter.
 * @param {ASTNode}    declarationToken The function the parameter is documented on.
 * @param {number}     paramIndex       The parameter index.
 * @return {string | undefined} The parameter's type annotation.
 */
function getParamTypeAnnotation( tag, declarationToken, paramIndex ) {
	const functionToken = getFunctionToken( declarationToken );

	let paramToken = functionToken?.params[ paramIndex ];

	// This shouldn't happen due to our ESLint enforcing correctly documented parameter names but just in case
	// we'll give a descriptive error so that it's easy to diagnose the issue.
	if ( ! paramToken ) {
		throw new Error(
			`Could not find corresponding parameter token for documented parameter '${
				tag.name
			}' in function '${ getFunctionNameForError( declarationToken ) }'.`
		);
	}

	if ( babelTypes.isAssignmentPattern( paramToken ) ) {
		paramToken = paramToken.left;
	}

	if (
		! paramToken.typeAnnotation ||
		! paramToken.typeAnnotation.typeAnnotation
	) {
		return;
	}

	const paramType = paramToken.typeAnnotation.typeAnnotation;
	const isQualifiedName = tag.name.includes( '.' );

	if (
		babelTypes.isIdentifier( paramToken ) ||
		babelTypes.isRestElement( paramToken ) ||
		( ( babelTypes.isArrayPattern( paramToken ) ||
			babelTypes.isObjectPattern( paramToken ) ) &&
			! isQualifiedName )
	) {
		return getTypeAnnotation( paramType );
	} else if ( babelTypes.isArrayPattern( paramToken ) ) {
		return getQualifiedArrayPatternTypeAnnotation( tag, paramType );
	} else if ( babelTypes.isObjectPattern( paramToken ) ) {
		return getQualifiedObjectPatternTypeAnnotation( tag, paramType );
	}
}

/**
 * @param {ASTNode} declarationToken A function token.
 * @return {string | undefined} The function's return type annotation.
 */
function getReturnTypeAnnotation( declarationToken ) {
	const functionToken = getFunctionToken( declarationToken );
	if ( ! functionToken.returnType ) {
		return;
	}

	return getTypeAnnotation( functionToken.returnType.typeAnnotation );
}

/**
 * @param {ASTNode} declarationToken
 * @return {string | undefined} The type annotation for the variable.
 */
function getVariableTypeAnnotation( declarationToken ) {
	let resolvedToken = declarationToken;
	if ( babelTypes.isExportNamedDeclaration( resolvedToken ) ) {
		resolvedToken = resolvedToken.declaration;
	}

	if ( babelTypes.isClassDeclaration( resolvedToken ) ) {
		// Just use the classname if we're exporting a class.
		return resolvedToken.id.name;
	}

	if ( babelTypes.isVariableDeclaration( resolvedToken ) ) {
		resolvedToken = resolvedToken.declarations[ 0 ].id;
	}

	try {
		return getTypeAnnotation( resolvedToken.typeAnnotation.typeAnnotation );
	} catch ( e ) {
		// Assume it's a fully undocumented variable, there's nothing we can do about that but fail silently.
	}
}

module.exports =
	/**
	 * @param {CommentTag}    tag   A comment tag.
	 * @param {ASTNode}       token A function token.
	 * @param {number | null} index The index of the parameter or `null` if not a param tag.
	 * @return {[string]} The type annotation for the given tag or null if the tag has no type annotation.
	 */
	function ( tag, token, index ) {
		// If the file is using JSDoc type annotations, use the JSDoc.
		if ( tag.type ) {
			return tag.type;
		}

		switch ( tag.tag ) {
			case 'param': {
				return getParamTypeAnnotation( tag, token, index );
			}
			case 'return': {
				return getReturnTypeAnnotation( token );
			}
			case 'type': {
				return getVariableTypeAnnotation( token );
			}
		}
	};
