/**
 * Internal dependencies
 */
const getTypeAnnotation = require( '../lib/get-type-annotation' );

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
		// function fn(foo: any): any {}
		const getNode = ( {
			paramType = 'TSAnyKeyword',
			returnType = 'TSAnyKeyword',
		} = {} ) => ( {
			type: 'FunctionDeclaration',
			id: {
				type: 'Identifier',
				name: 'fn',
				range: [ 9, 11 ],
			},
			generator: false,
			expression: false,
			async: false,
			params: [
				{
					type: 'Identifier',
					name: 'foo',
					range: [ 12, 20 ],
					typeAnnotation: {
						type: 'TSTypeAnnotation',
						range: [ 15, 20 ],
						typeAnnotation: {
							type: paramType,
							range: [ 17, 20 ],
						},
					},
				},
			],
			body: {
				type: 'BlockStatement',
				body: [],
				range: [ 27, 29 ],
			},
			range: [ 0, 29 ],
			returnType: {
				type: 'TSTypeAnnotation',
				range: [ 21, 26 ],
				typeAnnotation: {
					type: returnType,
					range: [ 23, 26 ],
				},
			},
		} );

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
				const node = getNode( { paramType } );
				expect( getTypeAnnotation( paramTag, node ) ).toBe( expected );
			}
		);

		it.each( keywordTypes )(
			`should get the return type for an %s`,
			( returnType, expected ) => {
				const node = getNode( { returnType } );
				expect( getTypeAnnotation( returnTag, node ) ).toBe( expected );
			}
		);
	} );

	describe( 'arrays, applied generic types, unions, intersections', () => {
		/**
		 * type MyType<T> = {};
		 * function fn(foo: MyType<string|number>[]): MyType<string&number>[] {}
		 */
		const node = {
			type: 'FunctionDeclaration',
			id: {
				type: 'Identifier',
				name: 'fn',
				range: [ 31, 33 ],
			},
			generator: false,
			expression: false,
			async: false,
			params: [
				{
					type: 'Identifier',
					name: 'foo',
					range: [ 34, 62 ],
					typeAnnotation: {
						type: 'TSTypeAnnotation',
						range: [ 37, 62 ],
						typeAnnotation: {
							type: 'TSArrayType',
							elementType: {
								type: 'TSTypeReference',
								typeName: {
									type: 'Identifier',
									name: 'MyType',
									range: [ 39, 45 ],
								},
								typeParameters: {
									type: 'TSTypeParameterInstantiation',
									range: [ 45, 60 ],
									params: [
										{
											type: 'TSUnionType',
											types: [
												{
													type: 'TSStringKeyword',
													range: [ 46, 52 ],
												},
												{
													type: 'TSNumberKeyword',
													range: [ 53, 59 ],
												},
											],
											range: [ 46, 59 ],
										},
									],
								},
								range: [ 39, 60 ],
							},
							range: [ 39, 62 ],
						},
					},
				},
			],
			body: {
				type: 'BlockStatement',
				body: [],
				range: [ 89, 91 ],
			},
			range: [ 22, 91 ],
			returnType: {
				type: 'TSTypeAnnotation',
				range: [ 63, 88 ],
				typeAnnotation: {
					type: 'TSArrayType',
					elementType: {
						type: 'TSTypeReference',
						typeName: {
							type: 'Identifier',
							name: 'MyType',
							range: [ 65, 71 ],
						},
						typeParameters: {
							type: 'TSTypeParameterInstantiation',
							range: [ 71, 86 ],
							params: [
								{
									type: 'TSIntersectionType',
									types: [
										{
											type: 'TSStringKeyword',
											range: [ 72, 78 ],
										},
										{
											type: 'TSNumberKeyword',
											range: [ 79, 85 ],
										},
									],
									range: [ 72, 85 ],
								},
							],
						},
						range: [ 65, 86 ],
					},
					range: [ 65, 88 ],
				},
			},
		};

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
		const getNode = ( { literalType, literalValue } ) => ( {
			type: 'FunctionDeclaration',
			start: 22,
			end: 65,
			loc: {
				start: {
					line: 3,
					column: 0,
				},
				end: {
					line: 3,
					column: 43,
				},
			},
			id: {
				type: 'Identifier',
				start: 31,
				end: 33,
				loc: {
					start: {
						line: 3,
						column: 9,
					},
					end: {
						line: 3,
						column: 11,
					},
					identifierName: 'fn',
				},
				name: 'fn',
			},
			generator: false,
			async: false,
			params: [
				{
					type: 'Identifier',
					start: 34,
					end: 55,
					loc: {
						start: {
							line: 3,
							column: 12,
						},
						end: {
							line: 3,
							column: 33,
						},
						identifierName: 'foo',
					},
					name: 'foo',
					typeAnnotation: {
						type: 'TSTypeAnnotation',
						start: 37,
						end: 55,
						loc: {
							start: {
								line: 3,
								column: 15,
							},
							end: {
								line: 3,
								column: 33,
							},
						},
						typeAnnotation: {
							type: 'TSLiteralType',
							start: 39,
							end: 55,
							loc: {
								start: {
									line: 3,
									column: 17,
								},
								end: {
									line: 3,
									column: 33,
								},
							},
							literal: {
								type: literalType,
								start: 39,
								end: 55,
								loc: {
									start: {
										line: 3,
										column: 17,
									},
									end: {
										line: 3,
										column: 33,
									},
								},
								value: literalValue,
							},
						},
					},
				},
			],
			returnType: {
				type: 'TSTypeAnnotation',
				start: 56,
				end: 62,
				loc: {
					start: {
						line: 3,
						column: 34,
					},
					end: {
						line: 3,
						column: 40,
					},
				},
				typeAnnotation: {
					type: 'TSLiteralType',
					start: 58,
					end: 62,
					loc: {
						start: {
							line: 3,
							column: 36,
						},
						end: {
							line: 3,
							column: 40,
						},
					},
					literal: {
						type: literalType,
						start: 58,
						end: 62,
						loc: {
							start: {
								line: 3,
								column: 36,
							},
							end: {
								line: 3,
								column: 40,
							},
						},
						value: literalValue,
					},
				},
			},
			body: {
				type: 'BlockStatement',
				start: 63,
				end: 65,
				loc: {
					start: {
						line: 3,
						column: 41,
					},
					end: {
						line: 3,
						column: 43,
					},
				},
				body: [],
				directives: [],
			},
		} );

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
					const node = getNode( { literalType, literalValue } );
					expect( getTypeAnnotation( tag, node ) ).toBe(
						literalResult
					);
				}
			);
		} );

		it( 'should get a string literal param', () => {
			const node = getNode( {
				literalType: 'StringLiteral',
				literalValue: 'a-string-literal',
			} );
			expect( getTypeAnnotation( paramTag, node ) ).toBe(
				"'a-string-literal'"
			);
		} );

		it( 'should get a string literal return', () => {
			const node = getNode( {
				literalType: 'StringLiteral',
				literalValue: 'a-string-literal',
			} );
			expect( getTypeAnnotation( returnTag, node ) ).toBe(
				"'a-string-literal'"
			);
		} );
	} );

	describe( 'type literals', () => {
		/**
		 *	function fn(
		 *		foo: {
		 *			(bar: string): void;
		 *			bar: string;
		 *			optionalBar?: 'left' | 'right';
		 *			[key: number]: string;
		 *		}
		 *	): {
		 *		(bar: string): void;
		 *		bar: string;
		 *		optionalBar?: 'left' | 'right';
		 *		[key: number]: string;
		 *	} {}
		 */
		const node = {
			type: 'FunctionDeclaration',
			start: 0,
			end: 229,
			loc: {
				start: {
					line: 1,
					column: 0,
				},
				end: {
					line: 13,
					column: 4,
				},
			},
			id: {
				type: 'Identifier',
				start: 9,
				end: 11,
				loc: {
					start: {
						line: 1,
						column: 9,
					},
					end: {
						line: 1,
						column: 11,
					},
					identifierName: 'fn',
				},
				name: 'fn',
			},
			generator: false,
			async: false,
			params: [
				{
					type: 'Identifier',
					start: 14,
					end: 126,
					loc: {
						start: {
							line: 2,
							column: 1,
						},
						end: {
							line: 7,
							column: 2,
						},
						identifierName: 'foo',
					},
					name: 'foo',
					typeAnnotation: {
						type: 'TSTypeAnnotation',
						start: 17,
						end: 126,
						loc: {
							start: {
								line: 2,
								column: 4,
							},
							end: {
								line: 7,
								column: 2,
							},
						},
						typeAnnotation: {
							type: 'TSTypeLiteral',
							start: 19,
							end: 126,
							loc: {
								start: {
									line: 2,
									column: 6,
								},
								end: {
									line: 7,
									column: 2,
								},
							},
							members: [
								{
									type: 'TSCallSignatureDeclaration',
									start: 27,
									end: 47,
									loc: {
										start: {
											line: 3,
											column: 5,
										},
										end: {
											line: 3,
											column: 25,
										},
									},
									parameters: [
										{
											type: 'Identifier',
											start: 28,
											end: 39,
											loc: {
												start: {
													line: 3,
													column: 6,
												},
												end: {
													line: 3,
													column: 17,
												},
												identifierName: 'bar',
											},
											name: 'bar',
											typeAnnotation: {
												type: 'TSTypeAnnotation',
												start: 31,
												end: 39,
												loc: {
													start: {
														line: 3,
														column: 9,
													},
													end: {
														line: 3,
														column: 17,
													},
												},
												typeAnnotation: {
													type: 'TSStringKeyword',
													start: 33,
													end: 39,
													loc: {
														start: {
															line: 3,
															column: 11,
														},
														end: {
															line: 3,
															column: 17,
														},
													},
												},
											},
										},
									],
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 40,
										end: 46,
										loc: {
											start: {
												line: 3,
												column: 18,
											},
											end: {
												line: 3,
												column: 24,
											},
										},
										typeAnnotation: {
											type: 'TSVoidKeyword',
											start: 42,
											end: 46,
											loc: {
												start: {
													line: 3,
													column: 20,
												},
												end: {
													line: 3,
													column: 24,
												},
											},
										},
									},
								},
								{
									type: 'TSPropertySignature',
									start: 53,
									end: 65,
									loc: {
										start: {
											line: 4,
											column: 5,
										},
										end: {
											line: 4,
											column: 17,
										},
									},
									key: {
										type: 'Identifier',
										start: 53,
										end: 56,
										loc: {
											start: {
												line: 4,
												column: 5,
											},
											end: {
												line: 4,
												column: 8,
											},
											identifierName: 'bar',
										},
										name: 'bar',
									},
									computed: false,
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 56,
										end: 64,
										loc: {
											start: {
												line: 4,
												column: 8,
											},
											end: {
												line: 4,
												column: 16,
											},
										},
										typeAnnotation: {
											type: 'TSStringKeyword',
											start: 58,
											end: 64,
											loc: {
												start: {
													line: 4,
													column: 10,
												},
												end: {
													line: 4,
													column: 16,
												},
											},
										},
									},
								},
								{
									type: 'TSPropertySignature',
									start: 68,
									end: 99,
									loc: {
										start: {
											line: 5,
											column: 2,
										},
										end: {
											line: 5,
											column: 33,
										},
									},
									key: {
										type: 'Identifier',
										start: 68,
										end: 79,
										loc: {
											start: {
												line: 5,
												column: 2,
											},
											end: {
												line: 5,
												column: 13,
											},
											identifierName: 'optionalBar',
										},
										name: 'optionalBar',
									},
									computed: false,
									optional: true,
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 80,
										end: 98,
										loc: {
											start: {
												line: 5,
												column: 14,
											},
											end: {
												line: 5,
												column: 32,
											},
										},
										typeAnnotation: {
											type: 'TSUnionType',
											start: 82,
											end: 98,
											loc: {
												start: {
													line: 5,
													column: 16,
												},
												end: {
													line: 5,
													column: 32,
												},
											},
											types: [
												{
													type: 'TSLiteralType',
													start: 82,
													end: 88,
													loc: {
														start: {
															line: 5,
															column: 16,
														},
														end: {
															line: 5,
															column: 22,
														},
													},
													literal: {
														type: 'StringLiteral',
														start: 82,
														end: 88,
														loc: {
															start: {
																line: 5,
																column: 16,
															},
															end: {
																line: 5,
																column: 22,
															},
														},
														extra: {
															rawValue: 'left',
															raw: "'left'",
														},
														value: 'left',
													},
												},
												{
													type: 'TSLiteralType',
													start: 91,
													end: 98,
													loc: {
														start: {
															line: 5,
															column: 25,
														},
														end: {
															line: 5,
															column: 32,
														},
													},
													literal: {
														type: 'StringLiteral',
														start: 91,
														end: 98,
														loc: {
															start: {
																line: 5,
																column: 25,
															},
															end: {
																line: 5,
																column: 32,
															},
														},
														extra: {
															rawValue: 'right',
															raw: "'right'",
														},
														value: 'right',
													},
												},
											],
										},
									},
								},
								{
									type: 'TSIndexSignature',
									start: 102,
									end: 123,
									loc: {
										start: {
											line: 6,
											column: 2,
										},
										end: {
											line: 6,
											column: 23,
										},
									},
									parameters: [
										{
											type: 'Identifier',
											start: 103,
											end: 114,
											loc: {
												start: {
													line: 6,
													column: 3,
												},
												end: {
													line: 6,
													column: 14,
												},
												identifierName: 'key',
											},
											name: 'key',
											typeAnnotation: {
												type: 'TSTypeAnnotation',
												start: 106,
												end: 114,
												loc: {
													start: {
														line: 6,
														column: 6,
													},
													end: {
														line: 6,
														column: 14,
													},
												},
												typeAnnotation: {
													type: 'TSNumberKeyword',
													start: 108,
													end: 114,
													loc: {
														start: {
															line: 6,
															column: 8,
														},
														end: {
															line: 6,
															column: 14,
														},
													},
												},
											},
										},
									],
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 115,
										end: 123,
										loc: {
											start: {
												line: 6,
												column: 15,
											},
											end: {
												line: 6,
												column: 23,
											},
										},
										typeAnnotation: {
											type: 'TSStringKeyword',
											start: 117,
											end: 123,
											loc: {
												start: {
													line: 6,
													column: 17,
												},
												end: {
													line: 6,
													column: 23,
												},
											},
										},
									},
								},
							],
						},
					},
				},
			],
			returnType: {
				type: 'TSTypeAnnotation',
				start: 128,
				end: 226,
				loc: {
					start: {
						line: 8,
						column: 1,
					},
					end: {
						line: 13,
						column: 1,
					},
				},
				typeAnnotation: {
					type: 'TSTypeLiteral',
					start: 130,
					end: 226,
					loc: {
						start: {
							line: 8,
							column: 3,
						},
						end: {
							line: 13,
							column: 1,
						},
					},
					members: [
						{
							type: 'TSCallSignatureDeclaration',
							start: 134,
							end: 154,
							loc: {
								start: {
									line: 9,
									column: 1,
								},
								end: {
									line: 9,
									column: 21,
								},
							},
							parameters: [
								{
									type: 'Identifier',
									start: 135,
									end: 146,
									loc: {
										start: {
											line: 9,
											column: 2,
										},
										end: {
											line: 9,
											column: 13,
										},
										identifierName: 'bar',
									},
									name: 'bar',
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 138,
										end: 146,
										loc: {
											start: {
												line: 9,
												column: 5,
											},
											end: {
												line: 9,
												column: 13,
											},
										},
										typeAnnotation: {
											type: 'TSStringKeyword',
											start: 140,
											end: 146,
											loc: {
												start: {
													line: 9,
													column: 7,
												},
												end: {
													line: 9,
													column: 13,
												},
											},
										},
									},
								},
							],
							typeAnnotation: {
								type: 'TSTypeAnnotation',
								start: 147,
								end: 153,
								loc: {
									start: {
										line: 9,
										column: 14,
									},
									end: {
										line: 9,
										column: 20,
									},
								},
								typeAnnotation: {
									type: 'TSVoidKeyword',
									start: 149,
									end: 153,
									loc: {
										start: {
											line: 9,
											column: 16,
										},
										end: {
											line: 9,
											column: 20,
										},
									},
								},
							},
						},
						{
							type: 'TSPropertySignature',
							start: 156,
							end: 168,
							loc: {
								start: {
									line: 10,
									column: 1,
								},
								end: {
									line: 10,
									column: 13,
								},
							},
							key: {
								type: 'Identifier',
								start: 156,
								end: 159,
								loc: {
									start: {
										line: 10,
										column: 1,
									},
									end: {
										line: 10,
										column: 4,
									},
									identifierName: 'bar',
								},
								name: 'bar',
							},
							computed: false,
							typeAnnotation: {
								type: 'TSTypeAnnotation',
								start: 159,
								end: 167,
								loc: {
									start: {
										line: 10,
										column: 4,
									},
									end: {
										line: 10,
										column: 12,
									},
								},
								typeAnnotation: {
									type: 'TSStringKeyword',
									start: 161,
									end: 167,
									loc: {
										start: {
											line: 10,
											column: 6,
										},
										end: {
											line: 10,
											column: 12,
										},
									},
								},
							},
						},
						{
							type: 'TSPropertySignature',
							start: 170,
							end: 201,
							loc: {
								start: {
									line: 11,
									column: 1,
								},
								end: {
									line: 11,
									column: 32,
								},
							},
							key: {
								type: 'Identifier',
								start: 170,
								end: 181,
								loc: {
									start: {
										line: 11,
										column: 1,
									},
									end: {
										line: 11,
										column: 12,
									},
									identifierName: 'optionalBar',
								},
								name: 'optionalBar',
							},
							computed: false,
							optional: true,
							typeAnnotation: {
								type: 'TSTypeAnnotation',
								start: 182,
								end: 200,
								loc: {
									start: {
										line: 11,
										column: 13,
									},
									end: {
										line: 11,
										column: 31,
									},
								},
								typeAnnotation: {
									type: 'TSUnionType',
									start: 184,
									end: 200,
									loc: {
										start: {
											line: 11,
											column: 15,
										},
										end: {
											line: 11,
											column: 31,
										},
									},
									types: [
										{
											type: 'TSLiteralType',
											start: 184,
											end: 190,
											loc: {
												start: {
													line: 11,
													column: 15,
												},
												end: {
													line: 11,
													column: 21,
												},
											},
											literal: {
												type: 'StringLiteral',
												start: 184,
												end: 190,
												loc: {
													start: {
														line: 11,
														column: 15,
													},
													end: {
														line: 11,
														column: 21,
													},
												},
												extra: {
													rawValue: 'left',
													raw: "'left'",
												},
												value: 'left',
											},
										},
										{
											type: 'TSLiteralType',
											start: 193,
											end: 200,
											loc: {
												start: {
													line: 11,
													column: 24,
												},
												end: {
													line: 11,
													column: 31,
												},
											},
											literal: {
												type: 'StringLiteral',
												start: 193,
												end: 200,
												loc: {
													start: {
														line: 11,
														column: 24,
													},
													end: {
														line: 11,
														column: 31,
													},
												},
												extra: {
													rawValue: 'right',
													raw: "'right'",
												},
												value: 'right',
											},
										},
									],
								},
							},
						},
						{
							type: 'TSIndexSignature',
							start: 203,
							end: 224,
							loc: {
								start: {
									line: 12,
									column: 1,
								},
								end: {
									line: 12,
									column: 22,
								},
							},
							parameters: [
								{
									type: 'Identifier',
									start: 204,
									end: 215,
									loc: {
										start: {
											line: 12,
											column: 2,
										},
										end: {
											line: 12,
											column: 13,
										},
										identifierName: 'key',
									},
									name: 'key',
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 207,
										end: 215,
										loc: {
											start: {
												line: 12,
												column: 5,
											},
											end: {
												line: 12,
												column: 13,
											},
										},
										typeAnnotation: {
											type: 'TSNumberKeyword',
											start: 209,
											end: 215,
											loc: {
												start: {
													line: 12,
													column: 7,
												},
												end: {
													line: 12,
													column: 13,
												},
											},
										},
									},
								},
							],
							typeAnnotation: {
								type: 'TSTypeAnnotation',
								start: 216,
								end: 224,
								loc: {
									start: {
										line: 12,
										column: 14,
									},
									end: {
										line: 12,
										column: 22,
									},
								},
								typeAnnotation: {
									type: 'TSStringKeyword',
									start: 218,
									end: 224,
									loc: {
										start: {
											line: 12,
											column: 16,
										},
										end: {
											line: 12,
											column: 22,
										},
									},
								},
							},
						},
					],
				},
			},
			body: {
				type: 'BlockStatement',
				start: 227,
				end: 229,
				loc: {
					start: {
						line: 13,
						column: 2,
					},
					end: {
						line: 13,
						column: 4,
					},
				},
				body: [],
				directives: [],
			},
		};

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
		// export function fn(foo: string): string {}
		const node = {
			type: 'ExportNamedDeclaration',
			start: 0,
			end: 42,
			loc: {
				start: {
					line: 1,
					column: 0,
				},
				end: {
					line: 1,
					column: 42,
				},
			},
			exportKind: 'value',
			specifiers: [],
			source: null,
			declaration: {
				type: 'FunctionDeclaration',
				start: 7,
				end: 42,
				loc: {
					start: {
						line: 1,
						column: 7,
					},
					end: {
						line: 1,
						column: 42,
					},
				},
				id: {
					type: 'Identifier',
					start: 16,
					end: 18,
					loc: {
						start: {
							line: 1,
							column: 16,
						},
						end: {
							line: 1,
							column: 18,
						},
						identifierName: 'fn',
					},
					name: 'fn',
				},
				generator: false,
				async: false,
				params: [
					{
						type: 'Identifier',
						start: 19,
						end: 30,
						loc: {
							start: {
								line: 1,
								column: 19,
							},
							end: {
								line: 1,
								column: 30,
							},
							identifierName: 'foo',
						},
						name: 'foo',
						typeAnnotation: {
							type: 'TSTypeAnnotation',
							start: 22,
							end: 30,
							loc: {
								start: {
									line: 1,
									column: 22,
								},
								end: {
									line: 1,
									column: 30,
								},
							},
							typeAnnotation: {
								type: 'TSStringKeyword',
								start: 24,
								end: 30,
								loc: {
									start: {
										line: 1,
										column: 24,
									},
									end: {
										line: 1,
										column: 30,
									},
								},
							},
						},
					},
				],
				returnType: {
					type: 'TSTypeAnnotation',
					start: 31,
					end: 39,
					loc: {
						start: {
							line: 1,
							column: 31,
						},
						end: {
							line: 1,
							column: 39,
						},
					},
					typeAnnotation: {
						type: 'TSStringKeyword',
						start: 33,
						end: 39,
						loc: {
							start: {
								line: 1,
								column: 33,
							},
							end: {
								line: 1,
								column: 39,
							},
						},
					},
				},
				body: {
					type: 'BlockStatement',
					start: 40,
					end: 42,
					loc: {
						start: {
							line: 1,
							column: 40,
						},
						end: {
							line: 1,
							column: 42,
						},
					},
					body: [],
					directives: [],
				},
			},
		};

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node ) ).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node ) ).toBe( 'string' );
		} );
	} );

	describe( 'exported variable declaration', () => {
		// export const fn = (foo: string): void => {}
		const node = {
			type: 'ExportNamedDeclaration',
			start: 0,
			end: 43,
			loc: {
				start: {
					line: 1,
					column: 0,
				},
				end: {
					line: 1,
					column: 43,
				},
			},
			exportKind: 'value',
			specifiers: [],
			source: null,
			declaration: {
				type: 'VariableDeclaration',
				start: 7,
				end: 43,
				loc: {
					start: {
						line: 1,
						column: 7,
					},
					end: {
						line: 1,
						column: 43,
					},
				},
				declarations: [
					{
						type: 'VariableDeclarator',
						start: 13,
						end: 43,
						loc: {
							start: {
								line: 1,
								column: 13,
							},
							end: {
								line: 1,
								column: 43,
							},
						},
						id: {
							type: 'Identifier',
							start: 13,
							end: 15,
							loc: {
								start: {
									line: 1,
									column: 13,
								},
								end: {
									line: 1,
									column: 15,
								},
								identifierName: 'fn',
							},
							name: 'fn',
						},
						init: {
							type: 'ArrowFunctionExpression',
							start: 18,
							end: 43,
							loc: {
								start: {
									line: 1,
									column: 18,
								},
								end: {
									line: 1,
									column: 43,
								},
							},
							returnType: {
								type: 'TSTypeAnnotation',
								start: 31,
								end: 37,
								loc: {
									start: {
										line: 1,
										column: 31,
									},
									end: {
										line: 1,
										column: 37,
									},
								},
								typeAnnotation: {
									type: 'TSVoidKeyword',
									start: 33,
									end: 37,
									loc: {
										start: {
											line: 1,
											column: 33,
										},
										end: {
											line: 1,
											column: 37,
										},
									},
								},
							},
							id: null,
							generator: false,
							async: false,
							params: [
								{
									type: 'Identifier',
									start: 19,
									end: 30,
									loc: {
										start: {
											line: 1,
											column: 19,
										},
										end: {
											line: 1,
											column: 30,
										},
										identifierName: 'foo',
									},
									name: 'foo',
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 22,
										end: 30,
										loc: {
											start: {
												line: 1,
												column: 22,
											},
											end: {
												line: 1,
												column: 30,
											},
										},
										typeAnnotation: {
											type: 'TSStringKeyword',
											start: 24,
											end: 30,
											loc: {
												start: {
													line: 1,
													column: 24,
												},
												end: {
													line: 1,
													column: 30,
												},
											},
										},
									},
								},
							],
							body: {
								type: 'BlockStatement',
								start: 41,
								end: 43,
								loc: {
									start: {
										line: 1,
										column: 41,
									},
									end: {
										line: 1,
										column: 43,
									},
								},
								body: [],
								directives: [],
							},
						},
					},
				],
				kind: 'const',
			},
		};

		it( 'should get the param type', () => {
			expect( getTypeAnnotation( paramTag, node ) ).toBe( 'string' );
		} );

		it( 'should get the return type', () => {
			expect( getTypeAnnotation( returnTag, node ) ).toBe( 'void' );
		} );
	} );

	describe( 'missing types', () => {
		const node = {
			type: 'VariableDeclaration',
			start: 0,
			end: 22,
			loc: {
				start: {
					line: 1,
					column: 0,
				},
				end: {
					line: 1,
					column: 22,
				},
			},
			declarations: [
				{
					type: 'VariableDeclarator',
					start: 6,
					end: 22,
					loc: {
						start: {
							line: 1,
							column: 6,
						},
						end: {
							line: 1,
							column: 22,
						},
					},
					id: {
						type: 'Identifier',
						start: 6,
						end: 8,
						loc: {
							start: {
								line: 1,
								column: 6,
							},
							end: {
								line: 1,
								column: 8,
							},
							identifierName: 'fn',
						},
						name: 'fn',
					},
					init: {
						type: 'ArrowFunctionExpression',
						start: 11,
						end: 22,
						loc: {
							start: {
								line: 1,
								column: 11,
							},
							end: {
								line: 1,
								column: 22,
							},
						},
						id: null,
						generator: false,
						async: false,
						params: [
							{
								type: 'Identifier',
								start: 12,
								end: 15,
								loc: {
									start: {
										line: 1,
										column: 12,
									},
									end: {
										line: 1,
										column: 15,
									},
									identifierName: 'foo',
								},
								name: 'foo',
							},
						],
						body: {
							type: 'BlockStatement',
							start: 20,
							end: 22,
							loc: {
								start: {
									line: 1,
									column: 20,
								},
								end: {
									line: 1,
									column: 22,
								},
							},
							body: [],
							directives: [],
						},
					},
				},
			],
			kind: 'const',
		};

		it( 'should throw an error if there is no return type', () => {
			expect( () => getTypeAnnotation( returnTag, node ) ).toThrow(
				'Could not find return type for "My favorite return"'
			);
		} );

		it( 'should throw an error if there is no param type', () => {
			expect( () => getTypeAnnotation( paramTag, node ) ).toThrow(
				'Could not find param type for "A foo parameter"'
			);
		} );
	} );
} );
