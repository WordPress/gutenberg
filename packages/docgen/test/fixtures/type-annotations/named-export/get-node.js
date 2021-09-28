module.exports = () => ( {
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
} );
