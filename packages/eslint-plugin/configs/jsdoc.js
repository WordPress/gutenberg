/**
 * External dependencies
 */
const globals = require( 'globals' );

/**
 * The temporary list of types defined in Gutenberg which are whitelisted to avoid
 * ESLint warnings. It should be removed once importing is going to be implemented
 * in the tool which generates public APIs from JSDoc comments. Related issue to
 * fix the root cause `@wordpress/docgen`:
 * https://github.com/WordPress/gutenberg/issues/18045.
 */
const temporaryWordPressInternalTypes = [
	'WPBlockChildren',
	'WPBlockNode',
	'WPBlockSelection',
	'WPBlockSerializationOptions',
	'WPBlock',
	'WPBlockPattern',
	'WPBlockTypeIcon',
	'WPBlockTypeIconRender',
	'WPBlockTypeIconDescriptor',
	'WPComponent',
	'WPElement',
	'WPIcon',
];

/**
 * The temporary list of external types used in Gutenberg which are whitelisted
 * to avoid ESLint warnings. It's similar to `wordpressInternalTypes` and it
 * should be removed once the related issues is fixed:
 * https://github.com/WordPress/gutenberg/issues/18045
 */
const temporaryExternalTypes = [
	'DOMHighResTimeStamp',
	'espree',
];

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
				...temporaryWordPressInternalTypes,
				...temporaryExternalTypes,
				'void',
			],
		} ],
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
	},
};
