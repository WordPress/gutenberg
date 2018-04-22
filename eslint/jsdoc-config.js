module.exports = {
	parser: 'babel-eslint',
	env: {
		browser: false,
		es6: true,
		node: true,
	},
	parserOptions: {
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	globals: {
		wp: true,
		window: true,
		document: true,
	},
	plugins: [
		'require-jsdoc-except',
	],
	rules: {
		'valid-jsdoc': [ 'error', {
			prefer: {
				arg: 'param',
				argument: 'param',
				extends: 'augments',
				returns: 'return',
			},
			preferType: {
				array: 'Array',
				bool: 'boolean',
				Boolean: 'boolean',
				float: 'number',
				Float: 'number',
				int: 'number',
				integer: 'number',
				Integer: 'number',
				Number: 'number',
				object: 'Object',
				String: 'string',
				Void: 'void',
			},
			requireParamDescription: false,
			requireReturn: false,
		} ],
		'require-jsdoc': 'off',
		'require-jsdoc-except/require-jsdoc': [ 'error', {
			require: {
				FunctionDeclaration: true,
				MethodDefinition: false,
				ClassDeclaration: true,
				ArrowFunctionExpression: true,
				FunctionExpression: true,
			},
			ignore: [ 'constructor', 'render' ],
		} ],
	},
};
