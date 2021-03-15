module.exports = ( { literalType, literalValue } ) => ( {
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
