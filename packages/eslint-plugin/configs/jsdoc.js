const globals = require( 'globals' );

/**
 * Helpful utilities that are globally defined and known to the TypeScript compiler.
 *
 * @see http://www.typescriptlang.org/docs/handbook/utility-types.html
 */
const typescriptUtilityTypes = [
	'ArrayLike',
	'Exclude',
	'Extract',
	'InstanceType',
	'Iterable',
	'IterableIterator',
	'NonNullable',
	'Omit',
	'Partial',
	'Pick',
	'PromiseLike',
	'Readonly',
	'ReadonlyArray',
	'ReadonlyMap',
	'ReadonlySet',
	'Record',
	'Required',
	'ReturnType',
	'ThisType',
];

module.exports = {
	extends: [
		'plugin:jsdoc/recommended',
	],
	settings: {
		jsdoc: {
			preferredTypes: {
				object: 'Object',
			},
			tagNamePreference: {
				returns: 'return',
				yields: 'yield',
			},
		},
	},
	rules: {
		'jsdoc/no-undefined-types': [ 'warn', {
			definedTypes: [
				// Required to reference browser types because we don't have the `browser` environment enabled for the project.
				// Here we filter out all browser globals that don't begin with an uppercase letter because those
				// generally refer to window-level event listeners and are not a valid type to reference (e.g. `onclick`).
				...Object.keys( globals.browser ).filter( ( k ) => /^[A-Z]/.test( k ) ),
				...typescriptUtilityTypes,
				'void',
			],
		} ],
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
	},
};
