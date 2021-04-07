module.exports = () => ( {
	type: 'VariableDeclaration',
	start: 0,
	end: 22,
	loc: {
		start: {
			line: 1,
			column: 0,
		},
		end: {
			line: 1,
			column: 22,
		},
	},
	declarations: [
		{
			type: 'VariableDeclarator',
			start: 6,
			end: 22,
			loc: {
				start: {
					line: 1,
					column: 6,
				},
				end: {
					line: 1,
					column: 22,
				},
			},
			id: {
				type: 'Identifier',
				start: 6,
				end: 8,
				loc: {
					start: {
						line: 1,
						column: 6,
					},
					end: {
						line: 1,
						column: 8,
					},
					identifierName: 'fn',
				},
				name: 'fn',
			},
			init: {
				type: 'ArrowFunctionExpression',
				start: 11,
				end: 22,
				loc: {
					start: {
						line: 1,
						column: 11,
					},
					end: {
						line: 1,
						column: 22,
					},
				},
				id: null,
				generator: false,
				async: false,
				params: [
					{
						type: 'Identifier',
						start: 12,
						end: 15,
						loc: {
							start: {
								line: 1,
								column: 12,
							},
							end: {
								line: 1,
								column: 15,
							},
							identifierName: 'foo',
						},
						name: 'foo',
					},
				],
				body: {
					type: 'BlockStatement',
					start: 20,
					end: 22,
					loc: {
						start: {
							line: 1,
							column: 20,
						},
						end: {
							line: 1,
							column: 22,
						},
					},
					body: [],
					directives: [],
				},
			},
		},
	],
	kind: 'const',
} );
