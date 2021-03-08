module.exports = () => ( {
	type: 'FunctionDeclaration',
	id: {
		type: 'Identifier',
		name: 'fn',
		range: [ 31, 33 ],
	},
	generator: false,
	expression: false,
	async: false,
	params: [
		{
			type: 'Identifier',
			name: 'foo',
			range: [ 34, 62 ],
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				range: [ 37, 62 ],
				typeAnnotation: {
					type: 'TSArrayType',
					elementType: {
						type: 'TSTypeReference',
						typeName: {
							type: 'Identifier',
							name: 'MyType',
							range: [ 39, 45 ],
						},
						typeParameters: {
							type: 'TSTypeParameterInstantiation',
							range: [ 45, 60 ],
							params: [
								{
									type: 'TSUnionType',
									types: [
										{
											type: 'TSStringKeyword',
											range: [ 46, 52 ],
										},
										{
											type: 'TSNumberKeyword',
											range: [ 53, 59 ],
										},
									],
									range: [ 46, 59 ],
								},
							],
						},
						range: [ 39, 60 ],
					},
					range: [ 39, 62 ],
				},
			},
		},
	],
	body: {
		type: 'BlockStatement',
		body: [],
		range: [ 89, 91 ],
	},
	range: [ 22, 91 ],
	returnType: {
		type: 'TSTypeAnnotation',
		range: [ 63, 88 ],
		typeAnnotation: {
			type: 'TSArrayType',
			elementType: {
				type: 'TSTypeReference',
				typeName: {
					type: 'Identifier',
					name: 'MyType',
					range: [ 65, 71 ],
				},
				typeParameters: {
					type: 'TSTypeParameterInstantiation',
					range: [ 71, 86 ],
					params: [
						{
							type: 'TSIntersectionType',
							types: [
								{
									type: 'TSStringKeyword',
									range: [ 72, 78 ],
								},
								{
									type: 'TSNumberKeyword',
									range: [ 79, 85 ],
								},
							],
							range: [ 72, 85 ],
						},
					],
				},
				range: [ 65, 86 ],
			},
			range: [ 65, 88 ],
		},
	},
} );
