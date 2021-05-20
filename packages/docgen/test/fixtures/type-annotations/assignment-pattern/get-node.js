module.exports = () => ( {
	type: 'FunctionDeclaration',
	start: 55,
	end: 115,
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
			value: '*\n * @param param0\n * @param param0.0\n * @return\n ',
			start: 0,
			end: 54,
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
		start: 64,
		end: 66,
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
	params: [
		{
			type: 'AssignmentPattern',
			start: 68,
			end: 88,
			loc: {
				start: {
					line: 6,
					column: 13,
				},
				end: {
					line: 6,
					column: 33,
				},
			},
			left: {
				type: 'ArrayPattern',
				start: 68,
				end: 83,
				loc: {
					start: {
						line: 6,
						column: 13,
					},
					end: {
						line: 6,
						column: 28,
					},
				},
				elements: [
					{
						type: 'Identifier',
						start: 70,
						end: 73,
						loc: {
							start: {
								line: 6,
								column: 15,
							},
							end: {
								line: 6,
								column: 18,
							},
							identifierName: 'foo',
						},
						name: 'foo',
					},
				],
				typeAnnotation: {
					type: 'TSTypeAnnotation',
					start: 75,
					end: 83,
					loc: {
						start: {
							line: 6,
							column: 20,
						},
						end: {
							line: 6,
							column: 28,
						},
					},
					typeAnnotation: {
						type: 'TSStringKeyword',
						start: 77,
						end: 83,
						loc: {
							start: {
								line: 6,
								column: 22,
							},
							end: {
								line: 6,
								column: 28,
							},
						},
					},
				},
			},
			right: {
				type: 'StringLiteral',
				start: 86,
				end: 88,
				loc: {
					start: {
						line: 6,
						column: 31,
					},
					end: {
						line: 6,
						column: 33,
					},
				},
				extra: {
					rawValue: '',
					raw: "''",
				},
				value: '',
			},
		},
	],
	returnType: {
		type: 'TSTypeAnnotation',
		start: 90,
		end: 98,
		loc: {
			start: {
				line: 6,
				column: 35,
			},
			end: {
				line: 6,
				column: 43,
			},
		},
		typeAnnotation: {
			type: 'TSStringKeyword',
			start: 92,
			end: 98,
			loc: {
				start: {
					line: 6,
					column: 37,
				},
				end: {
					line: 6,
					column: 43,
				},
			},
		},
	},
	body: {
		type: 'BlockStatement',
		start: 99,
		end: 115,
		loc: {
			start: {
				line: 6,
				column: 44,
			},
			end: {
				line: 8,
				column: 1,
			},
		},
		body: [
			{
				type: 'ReturnStatement',
				start: 102,
				end: 113,
				loc: {
					start: {
						line: 7,
						column: 1,
					},
					end: {
						line: 7,
						column: 12,
					},
				},
				argument: {
					type: 'Identifier',
					start: 109,
					end: 112,
					loc: {
						start: {
							line: 7,
							column: 8,
						},
						end: {
							line: 7,
							column: 11,
						},
						identifierName: 'foo',
					},
					name: 'foo',
				},
			},
		],
		directives: [],
	},
} );
