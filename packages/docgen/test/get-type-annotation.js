/**
 * Internal dependencies
 */
const engine = require( '../lib/engine' );
const getTypeAnnotation = require( '../lib/get-type-annotation' );

/**
 * Generate the AST necessary to assert inferred types.
 *
 * @param {string} code - Actual source code to parse.
 */
const parse = ( code ) => engine( 'test-code.ts', code ).ast.body[ 0 ];

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
		expect( result ).toBeFalsy();
	} );

	const paramTag = /** @type {const} */ ( {
		tag: 'param',
		type: '',
		name: 'foo',
		description: 'A foo parameter',
	} );

	describe( 'simple types', () => {
		const keywordTypes = [
			'any',
			'BigInt',
			'boolean',
			'never',
			'null',
			'number',
			'object',
			'string',
			'symbol',
			'undefined',
			'unknown',
			'void',
		];

		it.each( keywordTypes )(
			`should get the parameter type for an %s`,
			( typeName ) => {
				expect(
					getTypeAnnotation(
						{ tag: 'param', name: 'foo' },
						parse( `function fn(foo: ${ typeName }): any {}` ),
						0
					)
				).toBe( typeName );
			}
		);

		it.each( keywordTypes )(
			`should get the return type for an %s`,
			( typeName ) => {
				expect(
					getTypeAnnotation(
						{ tag: 'return' },
						parse( `function fn(foo: any): ${ typeName } {}` )
					)
				).toBe( typeName );
			}
		);
	} );

	describe( 'arrays, applied generic types, unions, intersections', () => {
		const node = parse( `
			function fn( foo: MyType< string | number >[] ): MyType< string & number >[] {
				return [];
			}
		` );

		it( 'should get the param type', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBe( 'MyType< string | number >[]' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( { tag: 'return' }, node ) ).toBe(
				'MyType< string & number >[]'
			);
		} );
	} );

	describe( 'qualified types', () => {
		const node = parse( `
			function fn( foo: My.Foo< string >, bar: My.Bar ) {
				return 0;
			}
		` );

		it( 'should get the qualified param type with type parameters', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBe( 'My.Foo< string >' );
		} );

		it( 'should get the qualified param type without type parameters', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'bar' }, node, 1 )
			).toBe( 'My.Bar' );
		} );
	} );

	describe( 'literal values', () => {
		it.each( [ "'a-string-literal'", '1000n', 'true', '1000' ] )(
			'should handle %s',
			( literal ) => {
				const node = parse( `
					function fn( foo: ${ literal } ): ${ literal } {
						return BigInt( '1000' ) as ${ literal };
					}
				` );
				expect(
					getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
				).toBe( literal );
			}
		);

		it.each( [ "'a-string-literal'", '1000n', 'true', '1000' ] )(
			'should handle %s in the return',
			( literal ) => {
				const node = parse( `
					function fn( foo: ${ literal } ): ${ literal } {
						return BigInt( '1000' ) as ${ literal };
					}
				` );
				expect( getTypeAnnotation( { tag: 'return' }, node ) ).toBe(
					literal
				);
			}
		);
	} );

	describe( 'type literals', () => {
		const node = parse( `
			function fn( foo: {
				( bar: string ): void;
				bar: string;
				optionalBar?: 'left' | 'right';
				[ key: number ]: string;
			} ): {
				( bar: string ): void;
				bar: string;
				optionalBar?: 'left' | 'right';
				[ key: number ]: string;
			} {}
		` );

		it( 'should get the param type literal annotation', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBe(
				"{ ( bar: string ): void; bar: string; optionalBar?: 'left' | 'right'; [ key: number ]: string; }"
			);
		} );

		it( 'should get the return type literal annotation', () => {
			expect( getTypeAnnotation( { tag: 'return' }, node ) ).toBe(
				"{ ( bar: string ): void; bar: string; optionalBar?: 'left' | 'right'; [ key: number ]: string; }"
			);
		} );
	} );

	describe( 'named export', () => {
		const node = parse( `export function fn( foo: string ): string {}` );

		it( 'should get the param type', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( { tag: 'return' }, node ) ).toBe(
				'string'
			);
		} );
	} );

	describe( 'exported variable declaration', () => {
		const node = parse( `export const fn = ( foo: string ): void => {};` );
		it( 'should get the param type', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( { tag: 'return' }, node ) ).toBe(
				'void'
			);
		} );
	} );

	describe( 'imports, parameterized types, rest types, operator types, type predicates, index accessed types', () => {
		const node = parse( `
			function fn(
				foo: import('react').bar.baz.types.ComponentType[ 'displayName' ],
				...rest: [ string | number, ...( keyof constant ) ]
			): foo is string {}
		` );

		it( 'should get the index accessed import type', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBe(
				"import( 'react' ).bar.baz.types.ComponentType[ 'displayName' ]"
			);
		} );

		it( 'should get the parameterized tuple rest type', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'rest' }, node, 1 )
			).toBe( '[ string | number, ...( keyof constant ) ]' );
		} );

		it( 'should get the type predicate return type', () => {
			expect( getTypeAnnotation( { tag: 'return' }, node ) ).toBe(
				'foo is string'
			);
		} );
	} );

	describe( 'missing types', () => {
		const node = parse( `function fn( foo ) {}` );

		it( 'should return empty value if there is no return type', () => {
			expect( getTypeAnnotation( { tag: 'return' }, node ) ).toBeFalsy();
		} );

		it( 'should return empty value if there is no param type', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBeFalsy();
		} );
	} );

	describe( 'function argument array-destructuring', () => {
		describe( 'array-type', () => {
			const node = parse( `
				function fn< T >( [ head ]: T[] ): T {
					return head;
				}
			` );

			it( 'should grab the whole type for the unqualified name', () => {
				expect(
					getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
				).toBe( 'T[]' );
			} );

			it( 'should get the individual type for the qualified name', () => {
				expect(
					getTypeAnnotation(
						{ tag: 'param', name: 'foo.0' },
						node,
						0
					)
				).toBe( 'T' );
			} );
		} );

		describe( 'tuple-type', () => {
			const node = parse( `
				function second< T, S = T >( [ head, sec ]: [ T, S ] ): S {
					return sec;
				}
			` );

			it( 'should grab the whole type for the unqualified name', () => {
				expect(
					getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
				).toBe( '[ T, S ]' );
			} );

			it( 'should get the individual type for the qualified name', () => {
				expect(
					getTypeAnnotation(
						{ tag: 'param', name: 'foo.1' },
						node,
						0
					)
				).toBe( 'S' );
			} );
		} );

		describe( 'any-other-type', () => {
			const node = parse( `
				function fn( [ first, second ]: ( T & S ) | V ): S {
					return second;
				}
			` );

			it( 'should get the full type name for the unqualified name', () => {
				expect(
					getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
				).toBe( '( T & S ) | V' );
			} );

			it( 'should get the full type with a qualification for the qualified name', () => {
				expect(
					getTypeAnnotation(
						{ tag: 'param', name: 'foo.1' },
						node,
						0
					)
				).toBe( '( ( T & S ) | V )[ 1 ]' );
			} );
		} );
	} );

	describe( 'arrow function parameters', () => {
		const node = parse( `
			export const fn = (
				callback: ( foo: string, ...rest: any[] ) => GenericType< T >
			): void => {};
		` );

		it( 'should correctly format the arrow function', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'callback' }, node, 0 )
			).toBe( '( foo: string, ...rest: any[] ) => GenericType< T >' );
		} );
	} );

	describe( 'function argument object destructuring', () => {
		describe( 'type literal', () => {
			const node = parse( `
				function fn( { foo, ...rest }: { foo: string } ): string {
					return foo;
				}
			` );

			it( 'should get the full type for the param', () => {
				expect(
					getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
				).toBe( '{ foo: string; }' );
			} );

			it( 'should get the member type for the param', () => {
				expect(
					getTypeAnnotation(
						{ tag: 'param', name: 'props.foo' },
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
		const node = parse( `
			function fn( [ foo ]: string = '' ): string {
				return foo;
			}
		` );

		it( 'should get the type of the assignment pattern', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'foo' }, node, 0 )
			).toBe( 'string' );
		} );

		it( 'should get the type of the assignment pattern for array destructuring', () => {
			expect(
				getTypeAnnotation( { tag: 'param', name: 'props.0' }, node, 0 )
			).toBe( '( string )[ 0 ]' );
		} );
	} );

	describe( 'static exported variable', () => {
		const node = parse( `
			/**
			 * This is a description of the variable
			*/
			export const foo: ( string | number )[] = [];
		` );

		it( 'should get the type of the variable', () => {
			expect( getTypeAnnotation( { tag: 'type' }, node, 0 ) ).toBe(
				'( string | number )[]'
			);
		} );
	} );

	describe( 'statically-wrapped function exceptions', () => {
		const getStateArgType = ( code ) => {
			const { tokens } = engine( 'test.ts', code );
			return getTypeAnnotation(
				{ tag: 'param', name: 'state' },
				tokens[ 0 ],
				0
			);
		};

		const docString = `/**
			 * Returns the number of things
			 *
			 * @param state - stores all the things
			 */`;
		it( 'should find types for a typecasted function', () => {
			const code = `${ docString }
			 export const getCount = ( state: string[] ) => state.length;
			 `;
			expect( getStateArgType( code ) ).toBe( 'string[]' );
		} );

		it( 'should find types for a doubly typecasted function', () => {
			const code = `${ docString }
				 export const getCount = ( ( state: string[] ) => state.length ) as any as any;
			 `;
			expect( getStateArgType( code ) ).toBe( 'string[]' );
		} );

		it( 'should find types for inner function with `createSelector`', () => {
			const code = `${ docString }
				 export const getCount = createSelector( ( state: string[] ) => state.length );
			 `;
			expect( getStateArgType( code ) ).toBe( 'string[]' );
		} );

		it( 'should find types for inner typecasted function with `createSelector`', () => {
			const code = `${ docString }
				 export const getCount = createSelector( (( state: string[] ) => state.length) as any );
			 `;
			expect( getStateArgType( code ) ).toBe( 'string[]' );
		} );

		it( 'should find types for inner function with `createRegistrySelector`', () => {
			const code = `${ docString }
				 export const getCount = createRegistrySelector( ( select ) => ( state: number ) => state );
			 `;
			expect( getStateArgType( code ) ).toBe( 'number' );
		} );
	} );

	it( 'should find types in a constant function expression assignment', () => {
		const node = parse( `
				export const __unstableAwaitPromise = function < T >( promise: Promise< T > ): {
					type: 'AWAIT_PROMISE';
					promise: Promise< T >;
				} {
					return {
						type: 'AWAIT_PROMISE',
						promise,
					};
				};
			 ` );

		expect(
			getTypeAnnotation( { tag: 'param', name: 'promise' }, node, 0 )
		).toBe( 'Promise< T >' );
	} );
} );
