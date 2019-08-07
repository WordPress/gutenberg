const globals = require( 'globals' );

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
			// Required to reference browser types because we don't have the `browser` environment enabled for the project.
			// Here we filter out all browser globals that don't begin with an uppercase letter because those
			// generally refer to window-level event listeners and are not a valid type to reference (e.g. `onclick`).
			definedTypes: Object.keys( globals.browser ).filter( ( k ) => /^[A-Z]/.test( k ) ),
		} ],
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
	},
};
