module.exports = () => ( {
	type: 'ExportNamedDeclaration',
	start: 49,
	end: 94,
	loc: {
		start: {
			line: 4,
			column: 0,
		},
		end: {
			line: 4,
			column: 45,
		},
	},
	leadingComments: [
		{
			type: 'CommentBlock',
			value: '*\n * This is a description of the variable\n ',
			start: 0,
			end: 48,
			loc: {
				start: {
					line: 1,
					column: 0,
				},
				end: {
					line: 3,
					column: 3,
				},
			},
		},
	],
	exportKind: 'value',
	specifiers: [],
	source: null,
	declaration: {
		type: 'VariableDeclaration',
		start: 56,
		end: 94,
		loc: {
			start: {
				line: 4,
				column: 7,
			},
			end: {
				line: 4,
				column: 45,
			},
		},
		declarations: [
			{
				type: 'VariableDeclarator',
				start: 62,
				end: 93,
				loc: {
					start: {
						line: 4,
						column: 13,
					},
					end: {
						line: 4,
						column: 44,
					},
				},
				id: {
					type: 'Identifier',
					start: 62,
					end: 88,
					loc: {
						start: {
							line: 4,
							column: 13,
						},
						end: {
							line: 4,
							column: 39,
						},
						identifierName: 'foo',
					},
					name: 'foo',
					typeAnnotation: {
						type: 'TSTypeAnnotation',
						start: 65,
						end: 88,
						loc: {
							start: {
								line: 4,
								column: 16,
							},
							end: {
								line: 4,
								column: 39,
							},
						},
						typeAnnotation: {
							type: 'TSArrayType',
							start: 67,
							end: 88,
							loc: {
								start: {
									line: 4,
									column: 18,
								},
								end: {
									line: 4,
									column: 39,
								},
							},
							elementType: {
								type: 'TSParenthesizedType',
								start: 67,
								end: 86,
								loc: {
									start: {
										line: 4,
										column: 18,
									},
									end: {
										line: 4,
										column: 37,
									},
								},
								typeAnnotation: {
									type: 'TSUnionType',
									start: 69,
									end: 84,
									loc: {
										start: {
											line: 4,
											column: 20,
										},
										end: {
											line: 4,
											column: 35,
										},
									},
									types: [
										{
											type: 'TSStringKeyword',
											start: 69,
											end: 75,
											loc: {
												start: {
													line: 4,
													column: 20,
												},
												end: {
													line: 4,
													column: 26,
												},
											},
										},
										{
											type: 'TSNumberKeyword',
											start: 78,
											end: 84,
											loc: {
												start: {
													line: 4,
													column: 29,
												},
												end: {
													line: 4,
													column: 35,
												},
											},
										},
									],
								},
							},
						},
					},
				},
				init: {
					type: 'ArrayExpression',
					start: 91,
					end: 93,
					loc: {
						start: {
							line: 4,
							column: 42,
						},
						end: {
							line: 4,
							column: 44,
						},
					},
					elements: [],
				},
			},
		],
		kind: 'const',
	},
} );
