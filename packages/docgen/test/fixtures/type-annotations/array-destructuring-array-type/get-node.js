module.exports = () => ( {
	type: 'FunctionDeclaration',
	start: 88,
	end: 142,
	loc: {
		start: {
			line: 6,
			column: 0,
		},
		end: {
			line: 8,
			column: 1,
		},
	},
	leadingComments: [
		{
			type: 'CommentBlock',
			value:
				'*\n * @param foo Array.\n * @param foo.0 The first foo.\n * @return The head of foo.\n ',
			start: 0,
			end: 87,
			loc: {
				start: {
					line: 1,
					column: 0,
				},
				end: {
					line: 5,
					column: 3,
				},
			},
		},
	],
	id: {
		type: 'Identifier',
		start: 97,
		end: 99,
		loc: {
			start: {
				line: 6,
				column: 9,
			},
			end: {
				line: 6,
				column: 11,
			},
			identifierName: 'fn',
		},
		name: 'fn',
	},
	generator: false,
	async: false,
	typeParameters: {
		type: 'TSTypeParameterDeclaration',
		start: 99,
		end: 104,
		loc: {
			start: {
				line: 6,
				column: 11,
			},
			end: {
				line: 6,
				column: 16,
			},
		},
		params: [
			{
				type: 'TSTypeParameter',
				start: 101,
				end: 102,
				loc: {
					start: {
						line: 6,
						column: 13,
					},
					end: {
						line: 6,
						column: 14,
					},
				},
				name: 'T',
			},
		],
	},
	params: [
		{
			type: 'ArrayPattern',
			start: 106,
			end: 119,
			loc: {
				start: {
					line: 6,
					column: 18,
				},
				end: {
					line: 6,
					column: 31,
				},
			},
			elements: [
				{
					type: 'Identifier',
					start: 108,
					end: 112,
					loc: {
						start: {
							line: 6,
							column: 20,
						},
						end: {
							line: 6,
							column: 24,
						},
						identifierName: 'head',
					},
					name: 'head',
				},
			],
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				start: 114,
				end: 119,
				loc: {
					start: {
						line: 6,
						column: 26,
					},
					end: {
						line: 6,
						column: 31,
					},
				},
				typeAnnotation: {
					type: 'TSArrayType',
					start: 116,
					end: 119,
					loc: {
						start: {
							line: 6,
							column: 28,
						},
						end: {
							line: 6,
							column: 31,
						},
					},
					elementType: {
						type: 'TSTypeReference',
						start: 116,
						end: 117,
						loc: {
							start: {
								line: 6,
								column: 28,
							},
							end: {
								line: 6,
								column: 29,
							},
						},
						typeName: {
							type: 'Identifier',
							start: 116,
							end: 117,
							loc: {
								start: {
									line: 6,
									column: 28,
								},
								end: {
									line: 6,
									column: 29,
								},
								identifierName: 'T',
							},
							name: 'T',
						},
					},
				},
			},
		},
	],
	returnType: {
		type: 'TSTypeAnnotation',
		start: 121,
		end: 124,
		loc: {
			start: {
				line: 6,
				column: 33,
			},
			end: {
				line: 6,
				column: 36,
			},
		},
		typeAnnotation: {
			type: 'TSTypeReference',
			start: 123,
			end: 124,
			loc: {
				start: {
					line: 6,
					column: 35,
				},
				end: {
					line: 6,
					column: 36,
				},
			},
			typeName: {
				type: 'Identifier',
				start: 123,
				end: 124,
				loc: {
					start: {
						line: 6,
						column: 35,
					},
					end: {
						line: 6,
						column: 36,
					},
					identifierName: 'T',
				},
				name: 'T',
			},
		},
	},
	body: {
		type: 'BlockStatement',
		start: 125,
		end: 142,
		loc: {
			start: {
				line: 6,
				column: 37,
			},
			end: {
				line: 8,
				column: 1,
			},
		},
		body: [
			{
				type: 'ReturnStatement',
				start: 128,
				end: 140,
				loc: {
					start: {
						line: 7,
						column: 1,
					},
					end: {
						line: 7,
						column: 13,
					},
				},
				argument: {
					type: 'Identifier',
					start: 135,
					end: 139,
					loc: {
						start: {
							line: 7,
							column: 8,
						},
						end: {
							line: 7,
							column: 12,
						},
						identifierName: 'head',
					},
					name: 'head',
				},
			},
		],
		directives: [],
	},
} );
