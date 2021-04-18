module.exports = () => ( {
	type: 'ExportNamedDeclaration',
	start: 0,
	end: 97,
	loc: {
		start: {
			line: 1,
			column: 0,
		},
		end: {
			line: 3,
			column: 14,
		},
	},
	exportKind: 'value',
	specifiers: [],
	source: null,
	declaration: {
		type: 'VariableDeclaration',
		start: 7,
		end: 97,
		loc: {
			start: {
				line: 1,
				column: 7,
			},
			end: {
				line: 3,
				column: 14,
			},
		},
		declarations: [
			{
				type: 'VariableDeclarator',
				start: 13,
				end: 96,
				loc: {
					start: {
						line: 1,
						column: 13,
					},
					end: {
						line: 3,
						column: 13,
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
					end: 96,
					loc: {
						start: {
							line: 1,
							column: 18,
						},
						end: {
							line: 3,
							column: 13,
						},
					},
					returnType: {
						type: 'TSTypeAnnotation',
						start: 84,
						end: 90,
						loc: {
							start: {
								line: 3,
								column: 1,
							},
							end: {
								line: 3,
								column: 7,
							},
						},
						typeAnnotation: {
							type: 'TSVoidKeyword',
							start: 86,
							end: 90,
							loc: {
								start: {
									line: 3,
									column: 3,
								},
								end: {
									line: 3,
									column: 7,
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
							start: 21,
							end: 82,
							loc: {
								start: {
									line: 2,
									column: 1,
								},
								end: {
									line: 2,
									column: 62,
								},
								identifierName: 'callback',
							},
							name: 'callback',
							typeAnnotation: {
								type: 'TSTypeAnnotation',
								start: 29,
								end: 82,
								loc: {
									start: {
										line: 2,
										column: 9,
									},
									end: {
										line: 2,
										column: 62,
									},
								},
								typeAnnotation: {
									type: 'TSFunctionType',
									start: 31,
									end: 82,
									loc: {
										start: {
											line: 2,
											column: 11,
										},
										end: {
											line: 2,
											column: 62,
										},
									},
									parameters: [
										{
											type: 'Identifier',
											start: 33,
											end: 44,
											loc: {
												start: {
													line: 2,
													column: 13,
												},
												end: {
													line: 2,
													column: 24,
												},
												identifierName: 'foo',
											},
											name: 'foo',
											typeAnnotation: {
												type: 'TSTypeAnnotation',
												start: 36,
												end: 44,
												loc: {
													start: {
														line: 2,
														column: 16,
													},
													end: {
														line: 2,
														column: 24,
													},
												},
												typeAnnotation: {
													type: 'TSStringKeyword',
													start: 38,
													end: 44,
													loc: {
														start: {
															line: 2,
															column: 18,
														},
														end: {
															line: 2,
															column: 24,
														},
													},
												},
											},
										},
										{
											type: 'RestElement',
											start: 46,
											end: 60,
											loc: {
												start: {
													line: 2,
													column: 26,
												},
												end: {
													line: 2,
													column: 40,
												},
											},
											argument: {
												type: 'Identifier',
												start: 49,
												end: 53,
												loc: {
													start: {
														line: 2,
														column: 29,
													},
													end: {
														line: 2,
														column: 33,
													},
													identifierName: 'rest',
												},
												name: 'rest',
											},
											typeAnnotation: {
												type: 'TSTypeAnnotation',
												start: 53,
												end: 60,
												loc: {
													start: {
														line: 2,
														column: 33,
													},
													end: {
														line: 2,
														column: 40,
													},
												},
												typeAnnotation: {
													type: 'TSArrayType',
													start: 55,
													end: 60,
													loc: {
														start: {
															line: 2,
															column: 35,
														},
														end: {
															line: 2,
															column: 40,
														},
													},
													elementType: {
														type: 'TSAnyKeyword',
														start: 55,
														end: 58,
														loc: {
															start: {
																line: 2,
																column: 35,
															},
															end: {
																line: 2,
																column: 38,
															},
														},
													},
												},
											},
										},
									],
									typeAnnotation: {
										type: 'TSTypeAnnotation',
										start: 63,
										end: 82,
										loc: {
											start: {
												line: 2,
												column: 43,
											},
											end: {
												line: 2,
												column: 62,
											},
										},
										typeAnnotation: {
											type: 'TSTypeReference',
											start: 66,
											end: 82,
											loc: {
												start: {
													line: 2,
													column: 46,
												},
												end: {
													line: 2,
													column: 62,
												},
											},
											typeName: {
												type: 'Identifier',
												start: 66,
												end: 77,
												loc: {
													start: {
														line: 2,
														column: 46,
													},
													end: {
														line: 2,
														column: 57,
													},
													identifierName:
														'GenericType',
												},
												name: 'GenericType',
											},
											typeParameters: {
												type:
													'TSTypeParameterInstantiation',
												start: 77,
												end: 82,
												loc: {
													start: {
														line: 2,
														column: 57,
													},
													end: {
														line: 2,
														column: 62,
													},
												},
												params: [
													{
														type: 'TSTypeReference',
														start: 79,
														end: 80,
														loc: {
															start: {
																line: 2,
																column: 59,
															},
															end: {
																line: 2,
																column: 60,
															},
														},
														typeName: {
															type: 'Identifier',
															start: 79,
															end: 80,
															loc: {
																start: {
																	line: 2,
																	column: 59,
																},
																end: {
																	line: 2,
																	column: 60,
																},
																identifierName:
																	'T',
															},
															name: 'T',
														},
													},
												],
											},
										},
									},
								},
							},
						},
					],
					body: {
						type: 'BlockStatement',
						start: 94,
						end: 96,
						loc: {
							start: {
								line: 3,
								column: 11,
							},
							end: {
								line: 3,
								column: 13,
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
} );
