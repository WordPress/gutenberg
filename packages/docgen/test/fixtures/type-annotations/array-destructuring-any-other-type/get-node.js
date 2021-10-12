module.exports = () => ( {
	type: 'FunctionDeclaration',
	start: 74,
	end: 144,
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
				'*\n * @param param0\n * @param param0.0\n * @param param0.1\n * @return\n ',
			start: 0,
			end: 73,
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
		start: 83,
		end: 85,
		loc: {
			start: {
				line: 7,
				column: 9,
			},
			end: {
				line: 7,
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
			type: 'ArrayPattern',
			start: 87,
			end: 119,
			loc: {
				start: {
					line: 7,
					column: 13,
				},
				end: {
					line: 7,
					column: 45,
				},
			},
			elements: [
				{
					type: 'Identifier',
					start: 89,
					end: 94,
					loc: {
						start: {
							line: 7,
							column: 15,
						},
						end: {
							line: 7,
							column: 20,
						},
						identifierName: 'first',
					},
					name: 'first',
				},
				{
					type: 'Identifier',
					start: 96,
					end: 102,
					loc: {
						start: {
							line: 7,
							column: 22,
						},
						end: {
							line: 7,
							column: 28,
						},
						identifierName: 'second',
					},
					name: 'second',
				},
			],
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				start: 104,
				end: 119,
				loc: {
					start: {
						line: 7,
						column: 30,
					},
					end: {
						line: 7,
						column: 45,
					},
				},
				typeAnnotation: {
					type: 'TSUnionType',
					start: 106,
					end: 119,
					loc: {
						start: {
							line: 7,
							column: 32,
						},
						end: {
							line: 7,
							column: 45,
						},
					},
					types: [
						{
							type: 'TSParenthesizedType',
							start: 106,
							end: 115,
							loc: {
								start: {
									line: 7,
									column: 32,
								},
								end: {
									line: 7,
									column: 41,
								},
							},
							typeAnnotation: {
								type: 'TSIntersectionType',
								start: 108,
								end: 113,
								loc: {
									start: {
										line: 7,
										column: 34,
									},
									end: {
										line: 7,
										column: 39,
									},
								},
								types: [
									{
										type: 'TSTypeReference',
										start: 108,
										end: 109,
										loc: {
											start: {
												line: 7,
												column: 34,
											},
											end: {
												line: 7,
												column: 35,
											},
										},
										typeName: {
											type: 'Identifier',
											start: 108,
											end: 109,
											loc: {
												start: {
													line: 7,
													column: 34,
												},
												end: {
													line: 7,
													column: 35,
												},
												identifierName: 'T',
											},
											name: 'T',
										},
									},
									{
										type: 'TSTypeReference',
										start: 112,
										end: 113,
										loc: {
											start: {
												line: 7,
												column: 38,
											},
											end: {
												line: 7,
												column: 39,
											},
										},
										typeName: {
											type: 'Identifier',
											start: 112,
											end: 113,
											loc: {
												start: {
													line: 7,
													column: 38,
												},
												end: {
													line: 7,
													column: 39,
												},
												identifierName: 'S',
											},
											name: 'S',
										},
									},
								],
							},
						},
						{
							type: 'TSTypeReference',
							start: 118,
							end: 119,
							loc: {
								start: {
									line: 7,
									column: 44,
								},
								end: {
									line: 7,
									column: 45,
								},
							},
							typeName: {
								type: 'Identifier',
								start: 118,
								end: 119,
								loc: {
									start: {
										line: 7,
										column: 44,
									},
									end: {
										line: 7,
										column: 45,
									},
									identifierName: 'V',
								},
								name: 'V',
							},
						},
					],
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
				line: 7,
				column: 47,
			},
			end: {
				line: 7,
				column: 50,
			},
		},
		typeAnnotation: {
			type: 'TSTypeReference',
			start: 123,
			end: 124,
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
				start: 123,
				end: 124,
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
	},
	body: {
		type: 'BlockStatement',
		start: 125,
		end: 144,
		loc: {
			start: {
				line: 7,
				column: 51,
			},
			end: {
				line: 9,
				column: 1,
			},
		},
		body: [
			{
				type: 'ReturnStatement',
				start: 128,
				end: 142,
				loc: {
					start: {
						line: 8,
						column: 1,
					},
					end: {
						line: 8,
						column: 15,
					},
				},
				argument: {
					type: 'Identifier',
					start: 135,
					end: 141,
					loc: {
						start: {
							line: 8,
							column: 8,
						},
						end: {
							line: 8,
							column: 14,
						},
						identifierName: 'second',
					},
					name: 'second',
				},
			},
		],
		directives: [],
	},
} );
