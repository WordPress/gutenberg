module.exports = () => ( {
	type: 'FunctionDeclaration',
	start: 0,
	end: 73,
	loc: {
		start: {
			line: 1,
			column: 0,
		},
		end: {
			line: 3,
			column: 1,
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
			type: 'ObjectPattern',
			start: 13,
			end: 46,
			loc: {
				start: {
					line: 1,
					column: 13,
				},
				end: {
					line: 1,
					column: 46,
				},
			},
			properties: [
				{
					type: 'ObjectProperty',
					start: 15,
					end: 18,
					loc: {
						start: {
							line: 1,
							column: 15,
						},
						end: {
							line: 1,
							column: 18,
						},
					},
					extra: {
						shorthand: true,
					},
					method: false,
					key: {
						type: 'Identifier',
						start: 15,
						end: 18,
						loc: {
							start: {
								line: 1,
								column: 15,
							},
							end: {
								line: 1,
								column: 18,
							},
							identifierName: 'foo',
						},
						name: 'foo',
					},
					computed: false,
					shorthand: true,
					value: {
						type: 'Identifier',
						start: 15,
						end: 18,
						loc: {
							start: {
								line: 1,
								column: 15,
							},
							end: {
								line: 1,
								column: 18,
							},
							identifierName: 'foo',
						},
						name: 'foo',
					},
				},
				{
					type: 'RestElement',
					start: 20,
					end: 27,
					loc: {
						start: {
							line: 1,
							column: 20,
						},
						end: {
							line: 1,
							column: 27,
						},
					},
					argument: {
						type: 'Identifier',
						start: 23,
						end: 27,
						loc: {
							start: {
								line: 1,
								column: 23,
							},
							end: {
								line: 1,
								column: 27,
							},
							identifierName: 'rest',
						},
						name: 'rest',
					},
				},
			],
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				start: 29,
				end: 46,
				loc: {
					start: {
						line: 1,
						column: 29,
					},
					end: {
						line: 1,
						column: 46,
					},
				},
				typeAnnotation: {
					type: 'TSTypeLiteral',
					start: 31,
					end: 46,
					loc: {
						start: {
							line: 1,
							column: 31,
						},
						end: {
							line: 1,
							column: 46,
						},
					},
					members: [
						{
							type: 'TSPropertySignature',
							start: 33,
							end: 44,
							loc: {
								start: {
									line: 1,
									column: 33,
								},
								end: {
									line: 1,
									column: 44,
								},
							},
							key: {
								type: 'Identifier',
								start: 33,
								end: 36,
								loc: {
									start: {
										line: 1,
										column: 33,
									},
									end: {
										line: 1,
										column: 36,
									},
									identifierName: 'foo',
								},
								name: 'foo',
							},
							computed: false,
							typeAnnotation: {
								type: 'TSTypeAnnotation',
								start: 36,
								end: 44,
								loc: {
									start: {
										line: 1,
										column: 36,
									},
									end: {
										line: 1,
										column: 44,
									},
								},
								typeAnnotation: {
									type: 'TSStringKeyword',
									start: 38,
									end: 44,
									loc: {
										start: {
											line: 1,
											column: 38,
										},
										end: {
											line: 1,
											column: 44,
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
		start: 48,
		end: 56,
		loc: {
			start: {
				line: 1,
				column: 48,
			},
			end: {
				line: 1,
				column: 56,
			},
		},
		typeAnnotation: {
			type: 'TSStringKeyword',
			start: 50,
			end: 56,
			loc: {
				start: {
					line: 1,
					column: 50,
				},
				end: {
					line: 1,
					column: 56,
				},
			},
		},
	},
	body: {
		type: 'BlockStatement',
		start: 57,
		end: 73,
		loc: {
			start: {
				line: 1,
				column: 57,
			},
			end: {
				line: 3,
				column: 1,
			},
		},
		body: [
			{
				type: 'ReturnStatement',
				start: 60,
				end: 71,
				loc: {
					start: {
						line: 2,
						column: 1,
					},
					end: {
						line: 2,
						column: 12,
					},
				},
				argument: {
					type: 'Identifier',
					start: 67,
					end: 70,
					loc: {
						start: {
							line: 2,
							column: 8,
						},
						end: {
							line: 2,
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
