module.exports = () => ( {
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
} );
