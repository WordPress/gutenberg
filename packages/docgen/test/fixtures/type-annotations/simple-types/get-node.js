module.exports = ( {
	paramType = 'TSAnyKeyword',
	returnType = 'TSAnyKeyword',
} = {} ) => ( {
	type: 'FunctionDeclaration',
	id: {
		type: 'Identifier',
		name: 'fn',
		range: [ 9, 11 ],
	},
	generator: false,
	expression: false,
	async: false,
	params: [
		{
			type: 'Identifier',
			name: 'foo',
			range: [ 12, 20 ],
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				range: [ 15, 20 ],
				typeAnnotation: {
					type: paramType,
					range: [ 17, 20 ],
				},
			},
		},
	],
	body: {
		type: 'BlockStatement',
		body: [],
		range: [ 27, 29 ],
	},
	range: [ 0, 29 ],
	returnType: {
		type: 'TSTypeAnnotation',
		range: [ 21, 26 ],
		typeAnnotation: {
			type: returnType,
			range: [ 23, 26 ],
		},
	},
} );
