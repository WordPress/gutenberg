module.exports = () => ( {
	type: 'FunctionDeclaration',
	start: 0,
	end: 153,
	loc: {
		start: {
			line: 1,
			column: 0,
		},
		end: {
			line: 4,
			column: 19,
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
			end: 79,
			loc: {
				start: {
					line: 2,
					column: 1,
				},
				end: {
					line: 2,
					column: 66,
				},
				identifierName: 'foo',
			},
			name: 'foo',
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				start: 17,
				end: 79,
				loc: {
					start: {
						line: 2,
						column: 4,
					},
					end: {
						line: 2,
						column: 66,
					},
				},
				typeAnnotation: {
					type: 'TSIndexedAccessType',
					start: 19,
					end: 79,
					loc: {
						start: {
							line: 2,
							column: 6,
						},
						end: {
							line: 2,
							column: 66,
						},
					},
					objectType: {
						type: 'TSImportType',
						start: 19,
						end: 62,
						loc: {
							start: {
								line: 2,
								column: 6,
							},
							end: {
								line: 2,
								column: 49,
							},
						},
						argument: {
							type: 'StringLiteral',
							start: 26,
							end: 33,
							loc: {
								start: {
									line: 2,
									column: 13,
								},
								end: {
									line: 2,
									column: 20,
								},
							},
							extra: {
								rawValue: 'react',
								raw: "'react'",
							},
							value: 'react',
						},
						qualifier: {
							type: 'TSQualifiedName',
							start: 35,
							end: 62,
							loc: {
								start: {
									line: 2,
									column: 22,
								},
								end: {
									line: 2,
									column: 49,
								},
							},
							left: {
								type: 'TSQualifiedName',
								start: 35,
								end: 48,
								loc: {
									start: {
										line: 2,
										column: 22,
									},
									end: {
										line: 2,
										column: 35,
									},
								},
								left: {
									type: 'TSQualifiedName',
									start: 35,
									end: 42,
									loc: {
										start: {
											line: 2,
											column: 22,
										},
										end: {
											line: 2,
											column: 29,
										},
									},
									left: {
										type: 'Identifier',
										start: 35,
										end: 38,
										loc: {
											start: {
												line: 2,
												column: 22,
											},
											end: {
												line: 2,
												column: 25,
											},
											identifierName: 'bar',
										},
										name: 'bar',
									},
									right: {
										type: 'Identifier',
										start: 39,
										end: 42,
										loc: {
											start: {
												line: 2,
												column: 26,
											},
											end: {
												line: 2,
												column: 29,
											},
											identifierName: 'baz',
										},
										name: 'baz',
									},
								},
								right: {
									type: 'Identifier',
									start: 43,
									end: 48,
									loc: {
										start: {
											line: 2,
											column: 30,
										},
										end: {
											line: 2,
											column: 35,
										},
										identifierName: 'types',
									},
									name: 'types',
								},
							},
							right: {
								type: 'Identifier',
								start: 49,
								end: 62,
								loc: {
									start: {
										line: 2,
										column: 36,
									},
									end: {
										line: 2,
										column: 49,
									},
									identifierName: 'ComponentType',
								},
								name: 'ComponentType',
							},
						},
					},
					indexType: {
						type: 'TSLiteralType',
						start: 64,
						end: 77,
						loc: {
							start: {
								line: 2,
								column: 51,
							},
							end: {
								line: 2,
								column: 64,
							},
						},
						literal: {
							type: 'StringLiteral',
							start: 64,
							end: 77,
							loc: {
								start: {
									line: 2,
									column: 51,
								},
								end: {
									line: 2,
									column: 64,
								},
							},
							extra: {
								rawValue: 'displayName',
								raw: "'displayName'",
							},
							value: 'displayName',
						},
					},
				},
			},
		},
		{
			type: 'RestElement',
			start: 82,
			end: 133,
			loc: {
				start: {
					line: 3,
					column: 1,
				},
				end: {
					line: 3,
					column: 52,
				},
			},
			argument: {
				type: 'Identifier',
				start: 85,
				end: 89,
				loc: {
					start: {
						line: 3,
						column: 4,
					},
					end: {
						line: 3,
						column: 8,
					},
					identifierName: 'rest',
				},
				name: 'rest',
			},
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				start: 89,
				end: 133,
				loc: {
					start: {
						line: 3,
						column: 8,
					},
					end: {
						line: 3,
						column: 52,
					},
				},
				typeAnnotation: {
					type: 'TSTupleType',
					start: 91,
					end: 133,
					loc: {
						start: {
							line: 3,
							column: 10,
						},
						end: {
							line: 3,
							column: 52,
						},
					},
					elementTypes: [
						{
							type: 'TSUnionType',
							start: 93,
							end: 108,
							loc: {
								start: {
									line: 3,
									column: 12,
								},
								end: {
									line: 3,
									column: 27,
								},
							},
							types: [
								{
									type: 'TSStringKeyword',
									start: 93,
									end: 99,
									loc: {
										start: {
											line: 3,
											column: 12,
										},
										end: {
											line: 3,
											column: 18,
										},
									},
								},
								{
									type: 'TSNumberKeyword',
									start: 102,
									end: 108,
									loc: {
										start: {
											line: 3,
											column: 21,
										},
										end: {
											line: 3,
											column: 27,
										},
									},
								},
							],
						},
						{
							type: 'TSRestType',
							start: 110,
							end: 131,
							loc: {
								start: {
									line: 3,
									column: 29,
								},
								end: {
									line: 3,
									column: 50,
								},
							},
							typeAnnotation: {
								type: 'TSParenthesizedType',
								start: 113,
								end: 131,
								loc: {
									start: {
										line: 3,
										column: 32,
									},
									end: {
										line: 3,
										column: 50,
									},
								},
								typeAnnotation: {
									type: 'TSTypeOperator',
									start: 115,
									end: 129,
									loc: {
										start: {
											line: 3,
											column: 34,
										},
										end: {
											line: 3,
											column: 48,
										},
									},
									operator: 'keyof',
									typeAnnotation: {
										type: 'TSTypeReference',
										start: 121,
										end: 129,
										loc: {
											start: {
												line: 3,
												column: 40,
											},
											end: {
												line: 3,
												column: 48,
											},
										},
										typeName: {
											type: 'Identifier',
											start: 121,
											end: 129,
											loc: {
												start: {
													line: 3,
													column: 40,
												},
												end: {
													line: 3,
													column: 48,
												},
												identifierName: 'constant',
											},
											name: 'constant',
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
		start: 135,
		end: 150,
		loc: {
			start: {
				line: 4,
				column: 1,
			},
			end: {
				line: 4,
				column: 16,
			},
		},
		typeAnnotation: {
			type: 'TSTypePredicate',
			start: 135,
			end: 150,
			loc: {
				start: {
					line: 4,
					column: 1,
				},
				end: {
					line: 4,
					column: 16,
				},
			},
			parameterName: {
				type: 'Identifier',
				start: 137,
				end: 140,
				loc: {
					start: {
						line: 4,
						column: 3,
					},
					end: {
						line: 4,
						column: 6,
					},
					identifierName: 'foo',
				},
				name: 'foo',
			},
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				start: 144,
				end: 150,
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
				typeAnnotation: {
					type: 'TSStringKeyword',
					start: 144,
					end: 150,
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
			asserts: false,
		},
	},
	body: {
		type: 'BlockStatement',
		start: 151,
		end: 153,
		loc: {
			start: {
				line: 4,
				column: 17,
			},
			end: {
				line: 4,
				column: 19,
			},
		},
		body: [],
		directives: [],
	},
} );
