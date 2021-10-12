module.exports = () => ( {
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
} );
