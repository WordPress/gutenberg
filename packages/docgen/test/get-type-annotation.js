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
const getArrayDestructuringArrayTypeNode = require( './fixtures/type-annotations/array-destructuring-array-type/get-node' );
const getArrayDestructuringTupleTypeNode = require( './fixtures/type-annotations/array-destructuring-tuple-type/get-node' );
const getArrayDestructuringAnyOtherTypeNode = require( './fixtures/type-annotations/array-destructuring-any-other-type/get-node' );
const getObjectDestructuringTypeLiteralNode = require( './fixtures/type-annotations/object-destructuring-object-literal-type/get-node' );
const getAssignmentPatternNode = require( './fixtures/type-annotations/assignment-pattern/get-node' );
const getExportedVariableDeclarationStaticNode = require( './fixtures/type-annotations/exported-variable-declaration-statics/get-node' );

describe( 'Type annotations', () => {
	it( 'are taken from JSDoc if any', () => {
		const tag = {
			tag: 'param',
			type: 'number',
		};
		const node = {};
		const result = getTypeAnnotation( tag, node, 0 );
		expect( result ).toBe( 'number' );
	} );

	it( "returns empty if no JSDoc type and TS data can't be inferred either", () => {
		const tag = {
			tag: 'unknown',
		};
		const node = {};
		const result = getTypeAnnotation( tag, node, 0 );
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
				expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe(
					expected
				);
			}
		);

		it.each( keywordTypes )(
			`should get the return type for an %s`,
			( returnType, expected ) => {
				const node = getSimpleTypeNode( { returnType } );
				expect( getTypeAnnotation( returnTag, node, 0 ) ).toBe(
					expected
				);
			}
		);
	} );

	describe( 'arrays, applied generic types, unions, intersections', () => {
		const node = getArraysGenericTypesUnionsAndIntersctionsNode();

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe(
				'MyType< string | number >[]'
			);
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node, 0 ) ).toBe(
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
					expect( getTypeAnnotation( tag, node, 0 ) ).toBe(
						literalResult
					);
				}
			);
		} );
	} );

	describe( 'type literals', () => {
		const node = getTypeLiteralNode();

		it( 'should get the param type literal annotation', () => {
			expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe(
				"{ ( bar: string ): void; bar: string; optionalBar?: 'left' | 'right'; [ key: number ]: string; }"
			);
		} );

		it( 'should get the return type literal annotation', () => {
			expect( getTypeAnnotation( returnTag, node, 0 ) ).toBe(
				"{ ( bar: string ): void; bar: string; optionalBar?: 'left' | 'right'; [ key: number ]: string; }"
			);
		} );
	} );

	describe( 'named export', () => {
		const node = getNamedExportNode();

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node, 0 ) ).toBe( 'string' );
		} );
	} );

	describe( 'exported variable declaration', () => {
		const node = getExportedVariableDeclarationNode();

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node, 0 ) ).toBe( 'void' );
		} );
	} );

	describe( 'imports, parameterized types, rest types, operator types, type predicates, index accessed types', () => {
		const node = getImportsParameterizedRestOperatorPredicateIndexerTypeNode();

		it( 'should get the index accessed import type', () => {
			expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe(
				"import( 'react' ).bar.baz.types.ComponentType[ 'displayName' ]"
			);
		} );

		it( 'should get the parameterized tuple rest type', () => {
			expect(
				getTypeAnnotation( { ...paramTag, name: 'rest' }, node, 1 )
			).toBe( '[ string | number, ...( keyof constant ) ]' );
		} );

		it( 'should get the type predicate return type', () => {
			expect( getTypeAnnotation( returnTag, node, 1 ) ).toBe(
				'foo is string'
			);
		} );
	} );

	describe( 'missing types', () => {
		const node = getMissingTypesNode();

		it( 'should return null if there is no return type', () => {
			expect( getTypeAnnotation( returnTag, node, 0 ) ).toBeNull();
		} );

		it( 'should return null if there is no param type', () => {
			expect( getTypeAnnotation( paramTag, node, 0 ) ).toBeNull();
		} );
	} );

	describe( 'function argument array-destructuring', () => {
		describe( 'array-type', () => {
			const node = getArrayDestructuringArrayTypeNode();

			it( 'should grab the whole type for the unqualified name', () => {
				expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe( 'T[]' );
			} );

			it( 'should get the individual type for the qualified name', () => {
				expect(
					getTypeAnnotation( { ...paramTag, name: 'foo.0' }, node, 0 )
				).toBe( 'T' );
			} );
		} );

		describe( 'tuple-type', () => {
			const node = getArrayDestructuringTupleTypeNode();

			it( 'should grab the whole type for the unqualified name', () => {
				expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe(
					'[ T, S ]'
				);
			} );

			it( 'should get the individual type for the qualified name', () => {
				expect(
					getTypeAnnotation( { ...paramTag, name: 'foo.1' }, node, 0 )
				).toBe( 'S' );
			} );
		} );

		describe( 'any-other-type', () => {
			const node = getArrayDestructuringAnyOtherTypeNode();

			it( 'should get the full type name for the unqualified name', () => {
				expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe(
					'( T & S ) | V'
				);
			} );

			it( 'should get the full type with a qualification for the qualified name', () => {
				expect(
					getTypeAnnotation( { ...paramTag, name: 'foo.1' }, node, 0 )
				).toBe( '( ( T & S ) | V )[ 1 ]' );
			} );
		} );
	} );

	describe( 'arrow function parameters', () => {
		const node = getArrowFunctionNode();

		it( 'should correctly format the arrow function', () => {
			expect(
				getTypeAnnotation( { ...paramTag, name: 'callback' }, node, 0 )
			).toBe( '( foo: string, ...rest: any[] ) => GenericType< T >' );
		} );
	} );

	describe( 'function argument object destructuring', () => {
		describe( 'type literal', () => {
			const node = getObjectDestructuringTypeLiteralNode();

			it( 'should get the full type for the param', () => {
				expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe(
					'{ foo: string; }'
				);
			} );

			it( 'should get the member type for the param', () => {
				expect(
					getTypeAnnotation(
						{ ...paramTag, name: 'props.foo' },
						node,
						0
					)
				).toBe( 'string' );
			} );

			it( 'should get the member type for an unfindable member', () => {
				expect(
					getTypeAnnotation(
						{ ...paramTag, name: 'props.notFoo' },
						node,
						0
					)
				).toBe( "{ foo: string; }[ 'notFoo' ]" );
			} );
		} );
	} );

	describe( 'assignment pattern', () => {
		const node = getAssignmentPatternNode();

		it( 'should get the type of the assignment pattern', () => {
			expect( getTypeAnnotation( paramTag, node, 0 ) ).toBe( 'string' );
		} );

		it( 'should get the type of the assignment pattern for array destructuring', () => {
			expect(
				getTypeAnnotation( { ...paramTag, name: 'props.0' }, node, 0 )
			).toBe( '( string )[ 0 ]' );
		} );
	} );

	describe( 'static exported variable', () => {
		const node = getExportedVariableDeclarationStaticNode();

		it( 'should get the type of the variable', () => {
			expect( getTypeAnnotation( { tag: 'type' }, node, 0 ) ).toBe(
				'( string | number )[]'
			);
		} );
	} );
} );
