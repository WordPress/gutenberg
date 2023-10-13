/**
 * External dependencies
 */
const globals = require( 'globals' );

/**
 * The temporary list of types defined in Gutenberg which are allowed to avoid
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
	'WPBlockType',
	'WPBlockTypeIcon',
	'WPBlockTypeIconRender',
	'WPBlockTypeIconDescriptor',
	'WPIcon',

	// These two should be removed once we use the TS types from "react".
	'Component',
	'Element',
];

/**
 * The temporary list of external types used in Gutenberg which are allowed
 * to avoid ESLint warnings. It's similar to `wordpressInternalTypes` and it
 * should be removed once the related issues is fixed:
 * https://github.com/WordPress/gutenberg/issues/18045
 */
const temporaryExternalTypes = [ 'DOMHighResTimeStamp', 'espree' ];

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
	'Parameters',
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
	'unknown',
	'never',
	'NodeJS',
	'AsyncIterableIterator',
	'NodeRequire',
	'true',
	'false',
];

module.exports = {
	extends: [ 'plugin:jsdoc/recommended' ],
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
		'jsdoc/no-defaults': 'off',
		'jsdoc/no-undefined-types': [
			'error',
			{
				definedTypes: [
					// Required to reference browser types because we don't have the `browser` environment enabled for the project.
					// Here we filter out all browser globals that don't begin with an uppercase letter because those
					// generally refer to window-level event listeners and are not a valid type to reference (e.g. `onclick`).
					...Object.keys( globals.browser ).filter( ( k ) =>
						/^[A-Z]/.test( k )
					),
					...typescriptUtilityTypes,
					...temporaryWordPressInternalTypes,
					...temporaryExternalTypes,
					'void',
					'JSX',
				],
			},
		],
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-yields': 'off',
		'jsdoc/tag-lines': [
			1,
			'any',
			{
				startLines: null,
				endLines: 0,
				applyToEndTag: false,
			},
		],
		'jsdoc/no-multi-asterisks': [
			'error',
			{ preventAtMiddleLines: false },
		],
		'jsdoc/check-access': 'error',
		'jsdoc/check-alignment': 'error',
		'jsdoc/check-line-alignment': [
			'error',
			'always',
			{
				tags: [ 'param', 'arg', 'argument', 'property', 'prop' ],
				preserveMainDescriptionPostDelimiter: true,
			},
		],
		'jsdoc/check-param-names': 'error',
		'jsdoc/check-property-names': 'error',
		'jsdoc/check-tag-names': 'error',
		'jsdoc/check-types': 'error',
		'jsdoc/check-values': 'off',
		'jsdoc/empty-tags': 'error',
		'jsdoc/implements-on-classes': 'error',
		'jsdoc/require-param': 'error',
		'jsdoc/require-param-name': 'error',
		'jsdoc/require-param-type': 'error',
		'jsdoc/require-property': 'error',
		'jsdoc/require-property-description': 'error',
		'jsdoc/require-property-name': 'error',
		'jsdoc/require-property-type': 'error',
		'jsdoc/require-returns-check': 'error',
		'jsdoc/require-returns-description': 'error',
		'jsdoc/require-returns-type': 'error',
		'jsdoc/valid-types': 'error',
	},
};
