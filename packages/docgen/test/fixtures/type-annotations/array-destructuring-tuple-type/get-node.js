module.exports = () => ( {
	type: 'FunctionDeclaration',
	start: 120,
	end: 194,
	loc: {
		start: {
			line: 7,
			column: 0,
		},
		end: {
			line: 9,
			column: 1,
		},
	},
	leadingComments: [
		{
			type: 'CommentBlock',
			value:
				'*\n * @param foo Array.\n * @param foo.0 The first foo.\n * @param foo.1 The second foo.\n * @return The head of foo.\n ',
			start: 0,
			end: 119,
			loc: {
				start: {
					line: 1,
					column: 0,
				},
				end: {
					line: 6,
					column: 3,
				},
			},
		},
	],
	id: {
		type: 'Identifier',
		start: 129,
		end: 135,
		loc: {
			start: {
				line: 7,
				column: 9,
			},
			end: {
				line: 7,
				column: 15,
			},
			identifierName: 'second',
		},
		name: 'second',
	},
	generator: false,
	async: false,
	typeParameters: {
		type: 'TSTypeParameterDeclaration',
		start: 135,
		end: 147,
		loc: {
			start: {
				line: 7,
				column: 15,
			},
			end: {
				line: 7,
				column: 27,
			},
		},
		params: [
			{
				type: 'TSTypeParameter',
				start: 137,
				end: 138,
				loc: {
					start: {
						line: 7,
						column: 17,
					},
					end: {
						line: 7,
						column: 18,
					},
				},
				name: 'T',
			},
			{
				type: 'TSTypeParameter',
				start: 140,
				end: 145,
				loc: {
					start: {
						line: 7,
						column: 20,
					},
					end: {
						line: 7,
						column: 25,
					},
				},
				name: 'S',
				default: {
					type: 'TSTypeReference',
					start: 144,
					end: 145,
					loc: {
						start: {
							line: 7,
							column: 24,
						},
						end: {
							line: 7,
							column: 25,
						},
					},
					typeName: {
						type: 'Identifier',
						start: 144,
						end: 145,
						loc: {
							start: {
								line: 7,
								column: 24,
							},
							end: {
								line: 7,
								column: 25,
							},
							identifierName: 'T',
						},
						name: 'T',
					},
				},
			},
		],
	},
	params: [
		{
			type: 'ArrayPattern',
			start: 149,
			end: 172,
			loc: {
				start: {
					line: 7,
					column: 29,
				},
				end: {
					line: 7,
					column: 52,
				},
			},
			elements: [
				{
					type: 'Identifier',
					start: 151,
					end: 155,
					loc: {
						start: {
							line: 7,
							column: 31,
						},
						end: {
							line: 7,
							column: 35,
						},
						identifierName: 'head',
					},
					name: 'head',
				},
				{
					type: 'Identifier',
					start: 157,
					end: 160,
					loc: {
						start: {
							line: 7,
							column: 37,
						},
						end: {
							line: 7,
							column: 40,
						},
						identifierName: 'sec',
					},
					name: 'sec',
				},
			],
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				start: 162,
				end: 172,
				loc: {
					start: {
						line: 7,
						column: 42,
					},
					end: {
						line: 7,
						column: 52,
					},
				},
				typeAnnotation: {
					type: 'TSTupleType',
					start: 164,
					end: 172,
					loc: {
						start: {
							line: 7,
							column: 44,
						},
						end: {
							line: 7,
							column: 52,
						},
					},
					elementTypes: [
						{
							type: 'TSTypeReference',
							start: 166,
							end: 167,
							loc: {
								start: {
									line: 7,
									column: 46,
								},
								end: {
									line: 7,
									column: 47,
								},
							},
							typeName: {
								type: 'Identifier',
								start: 166,
								end: 167,
								loc: {
									start: {
										line: 7,
										column: 46,
									},
									end: {
										line: 7,
										column: 47,
									},
									identifierName: 'T',
								},
								name: 'T',
							},
						},
						{
							type: 'TSTypeReference',
							start: 169,
							end: 170,
							loc: {
								start: {
									line: 7,
									column: 49,
								},
								end: {
									line: 7,
									column: 50,
								},
							},
							typeName: {
								type: 'Identifier',
								start: 169,
								end: 170,
								loc: {
									start: {
										line: 7,
										column: 49,
									},
									end: {
										line: 7,
										column: 50,
									},
									identifierName: 'S',
								},
								name: 'S',
							},
						},
					],
				},
			},
		},
	],
	returnType: {
		type: 'TSTypeAnnotation',
		start: 174,
		end: 177,
		loc: {
			start: {
				line: 7,
				column: 54,
			},
			end: {
				line: 7,
				column: 57,
			},
		},
		typeAnnotation: {
			type: 'TSTypeReference',
			start: 176,
			end: 177,
			loc: {
				start: {
					line: 7,
					column: 56,
				},
				end: {
					line: 7,
					column: 57,
				},
			},
			typeName: {
				type: 'Identifier',
				start: 176,
				end: 177,
				loc: {
					start: {
						line: 7,
						column: 56,
					},
					end: {
						line: 7,
						column: 57,
					},
					identifierName: 'S',
				},
				name: 'S',
			},
		},
	},
	body: {
		type: 'BlockStatement',
		start: 178,
		end: 194,
		loc: {
			start: {
				line: 7,
				column: 58,
			},
			end: {
				line: 9,
				column: 1,
			},
		},
		body: [
			{
				type: 'ReturnStatement',
				start: 181,
				end: 192,
				loc: {
					start: {
						line: 8,
						column: 1,
					},
					end: {
						line: 8,
						column: 12,
					},
				},
				argument: {
					type: 'Identifier',
					start: 188,
					end: 191,
					loc: {
						start: {
							line: 8,
							column: 8,
						},
						end: {
							line: 8,
							column: 11,
						},
						identifierName: 'sec',
					},
					name: 'sec',
				},
			},
		],
		directives: [],
	},
} );
