/**
 * Internal dependencies
 */
const getTypeAnnotation = require( '../lib/get-type-annotation' );

const getSimpleTypeNode = require( './fixtures/type-annotations/simple-types/get-node' );
const getArraysGenericTypesUnionsAndIntersctionsNode = require( './fixtures/type-annotations/arrays-generic-types-unions-intersections/get-node' );
const getLiteralsNode = require( './fixtures/type-annotations/literal-values/get-node' );
const getTypeLiteralNode = require( './fixtures/type-annotations/type-literals/get-node' );
const getNamedExportNode = require( './fixtures/type-annotations/named-export/get-node' );
const getExportedVariableDeclarationNode = require( './fixtures/type-annotations/exported-variable-declaration/get-node' );
const getImportsParameterizedRestOperatorPredicateIndexerTypeNode = require( './fixtures/type-annotations/imports-parameterized-rest-operator-predicate-indexers/get-node' );
const getMissingTypesNode = require( './fixtures/type-annotations/missing-types/get-node' );
const getArrowFunctionNode = require( './fixtures/type-annotations/arrow-function/get-node' );

describe( 'Type annotations', () => {
	it( 'are taken from JSDoc if any', () => {
		const tag = {
			tag: 'param',
			type: 'number',
		};
		const node = {};
		const result = getTypeAnnotation( tag, node );
		expect( result ).toBe( 'number' );
	} );

	it( "returns empty if no JSDoc type and TS data can't be inferred either", () => {
		const tag = {
			tag: 'unknown',
		};
		const node = {};
		const result = getTypeAnnotation( tag, node );
		expect( result ).toBe( '' );
	} );

	const paramTag = {
		tag: 'param',
		type: '',
		name: 'foo',
		description: 'A foo parameter',
	};

	const returnTag = {
		tag: 'return',
		type: '',
		name: 'My',
		description: 'favorite return',
	};

	describe( 'simple types', () => {
		const keywordTypes = [
			[ 'TSAnyKeyword', 'any' ],
			[ 'TSBigIntKeyword', 'BigInt' ],
			[ 'TSBooleanKeyword', 'boolean' ],
			[ 'TSNeverKeyword', 'never' ],
			[ 'TSNullKeyword', 'null' ],
			[ 'TSNumberKeyword', 'number' ],
			[ 'TSObjectKeyword', 'object' ],
			[ 'TSStringKeyword', 'string' ],
			[ 'TSSymbolKeyword', 'symbol' ],
			[ 'TSUndefinedKeyword', 'undefined' ],
			[ 'TSUnknownKeyword', 'unknown' ],
			[ 'TSVoidKeyword', 'void' ],
		];

		it.each( keywordTypes )(
			`should get the parameter type for an %s`,
			( paramType, expected ) => {
				const node = getSimpleTypeNode( { paramType } );
				expect( getTypeAnnotation( paramTag, node ) ).toBe( expected );
			}
		);

		it.each( keywordTypes )(
			`should get the return type for an %s`,
			( returnType, expected ) => {
				const node = getSimpleTypeNode( { returnType } );
				expect( getTypeAnnotation( returnTag, node ) ).toBe( expected );
			}
		);
	} );

	describe( 'arrays, applied generic types, unions, intersections', () => {
		const node = getArraysGenericTypesUnionsAndIntersctionsNode();

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node ) ).toBe(
				'MyType< string | number >[]'
			);
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node ) ).toBe(
				'MyType< string & number >[]'
			);
		} );
	} );

	describe( 'literal values', () => {
		describe.each( [
			[ 'param', paramTag ],
			[ 'return', returnTag ],
		] )( '%s', ( _, tag ) => {
			it.each( [
				[ 'StringLiteral', 'a-string-literal', "'a-string-literal'" ],
				[ 'BigIntLiteral', 1000, '1000n' ],
				[ 'BooleanLiteral', true, 'true' ],
				[ 'NumericLiteral', 1000, '1000' ],
			] )(
				'should handle %s',
				( literalType, literalValue, literalResult ) => {
					const node = getLiteralsNode( {
						literalType,
						literalValue,
					} );
					expect( getTypeAnnotation( tag, node ) ).toBe(
						literalResult
					);
				}
			);
		} );
	} );

	describe( 'type literals', () => {
		const node = getTypeLiteralNode();

		it( 'should get the param type literal annotation', () => {
			expect( getTypeAnnotation( paramTag, node ) ).toBe(
				"{ ( bar: string ): void; bar: string; optionalBar?: 'left' | 'right'; [ key: number ]: string; }"
			);
		} );

		it( 'should get the return type literal annotation', () => {
			expect( getTypeAnnotation( returnTag, node ) ).toBe(
				"{ ( bar: string ): void; bar: string; optionalBar?: 'left' | 'right'; [ key: number ]: string; }"
			);
		} );
	} );

	describe( 'named export', () => {
		const node = getNamedExportNode();

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node ) ).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node ) ).toBe( 'string' );
		} );
	} );

	describe( 'exported variable declaration', () => {
		const node = getExportedVariableDeclarationNode();

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node ) ).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node ) ).toBe( 'void' );
		} );
	} );

	describe( 'imports, parameterized types, rest types, operator types, type predicates, index accessed types', () => {
		const node = getImportsParameterizedRestOperatorPredicateIndexerTypeNode();

		it( 'should get the index accessed import type', () => {
			expect( getTypeAnnotation( paramTag, node ) ).toBe(
				"import( 'react' ).bar.baz.types.ComponentType[ 'displayName' ]"
			);
		} );

		it( 'should get the parameterized tuple rest type', () => {
			expect(
				getTypeAnnotation( { ...paramTag, name: 'rest' }, node )
			).toBe( '[ string | number, ...( keyof constant ) ]' );
		} );

		it( 'should get the type predicate return type', () => {
			expect( getTypeAnnotation( returnTag, node ) ).toBe(
				'foo is string'
			);
		} );
	} );

	describe( 'missing types', () => {
		const node = getMissingTypesNode();

		it( 'should throw an error if there is no return type', () => {
			expect( () => getTypeAnnotation( returnTag, node ) ).toThrow(
				"Could not find return type for function 'fn'."
			);
		} );

		it( 'should throw an error if there is no param type', () => {
			expect( () => getTypeAnnotation( paramTag, node ) ).toThrow(
				"Could not find type for parameter 'foo' in function 'fn'."
			);
		} );

		it( 'should throw an error if it cannot find the param by name', () => {
			expect( () =>
				getTypeAnnotation( { ...paramTag, name: 'notFoo' }, node )
			).toThrow(
				"Could not find corresponding parameter token for documented parameter 'notFoo' in function 'fn'."
			);
		} );
	} );

	describe( 'arrow function parameters', () => {
		const node = getArrowFunctionNode();

		it( 'should correctly format the arrow function', () => {
			expect(
				getTypeAnnotation( { ...paramTag, name: 'callback' }, node )
			).toBe( '( foo: string, ...rest: any[] ) => GenericType< T >' );
		} );
	} );
} );
