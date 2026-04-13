/**
 * Legacy eslintrc compatibility wrapper for @wordpress/eslint-plugin.
 *
 * This module converts the flat config arrays exported by the plugin
 * into eslintrc-compatible config objects, allowing consumers still
 * on ESLint v9 (eslintrc mode) to use the plugin during the transition.
 *
 * Usage (.eslintrc.js):
 *   const wordpress = require( '@wordpress/eslint-plugin/eslintrc' );
 *   module.exports = wordpress.configs.recommended;
 *
 * @deprecated Use the flat config export instead. This wrapper will be
 * removed in the next major version.
 */

process.emitWarning(
	'@wordpress/eslint-plugin/eslintrc is deprecated. ' +
		'Please migrate to flat config (eslint.config.mjs). ' +
		'See https://developer.wordpress.org/block-editor/reference-guides/packages/packages-eslint-plugin/ for migration instructions.',
	'DeprecationWarning'
);

const plugin = require( '../' );

/**
 * Map of ESLint plugin namespace to the npm package name used in
 * eslintrc `plugins` arrays (short form, without `eslint-plugin-` prefix).
 */
const PLUGIN_NAMESPACE_TO_ESLINTRC_NAME = {
	'@wordpress': '@wordpress',
	'@typescript-eslint': '@typescript-eslint',
	react: 'react',
	'react-hooks': 'react-hooks',
	import: 'import',
	jsdoc: 'jsdoc',
	'jsx-a11y': 'jsx-a11y',
	jest: 'jest',
	'jest-dom': 'jest-dom',
	'testing-library': 'testing-library',
	prettier: 'prettier',
	playwright: 'playwright',
	'@eslint-community/eslint-comments': '@eslint-community/eslint-comments',
};

/**
 * Map of flat config parser meta.name to the eslintrc-resolvable parser
 * package name. In flat config, parsers are object references; in eslintrc,
 * they are strings resolved via require().
 */
const PARSER_NAME_TO_ESLINTRC = {
	'@wordpress/babel-eslint-parser-compat': '@babel/eslint-parser',
	'typescript-eslint/parser': '@typescript-eslint/parser',
};

/**
 * Convert a flat config array to an eslintrc-compatible config object.
 *
 * @param {Array} flatConfigs Array of flat config objects.
 * @return {Object} eslintrc-compatible config object.
 */
function flatToEslintrc( flatConfigs ) {
	const rules = {};
	const pluginNames = new Set();
	const settings = {};
	const overrides = [];
	const globals = {};
	let parserOptions = {};
	let parser;

	for ( const config of flatConfigs ) {
		// Collect plugin names.
		if ( config.plugins ) {
			for ( const name of Object.keys( config.plugins ) ) {
				const eslintrcName = PLUGIN_NAMESPACE_TO_ESLINTRC_NAME[ name ];
				if ( eslintrcName ) {
					pluginNames.add( eslintrcName );
				}
			}
		}

		if ( config.files ) {
			// File-scoped config becomes an override.
			const override = {
				files: Array.isArray( config.files )
					? config.files
					: [ config.files ],
			};
			if ( config.rules ) {
				override.rules = { ...config.rules };
			}
			if ( config.settings ) {
				override.settings = { ...config.settings };
			}
			if ( config.languageOptions?.parser ) {
				const parserMeta = config.languageOptions.parser.meta;
				if ( parserMeta?.name ) {
					override.parser =
						PARSER_NAME_TO_ESLINTRC[ parserMeta.name ] ||
						parserMeta.name;
				}
			}
			if ( config.languageOptions?.parserOptions ) {
				override.parserOptions = {
					...config.languageOptions.parserOptions,
				};
			}
			overrides.push( override );
		} else {
			// Global config: merge into base.
			if ( config.rules ) {
				Object.assign( rules, config.rules );
			}
			if ( config.settings ) {
				Object.assign( settings, config.settings );
			}
			if ( config.languageOptions?.globals ) {
				Object.assign( globals, config.languageOptions.globals );
			}
			if ( config.languageOptions?.parser && ! parser ) {
				const parserMeta = config.languageOptions.parser.meta;
				if ( parserMeta?.name ) {
					parser =
						PARSER_NAME_TO_ESLINTRC[ parserMeta.name ] ||
						parserMeta.name;
				}
			}
			if ( config.languageOptions?.parserOptions ) {
				parserOptions = {
					...parserOptions,
					...config.languageOptions.parserOptions,
				};
			}
		}
	}

	const result = {
		plugins: [ ...pluginNames ],
		rules,
	};

	if ( Object.keys( globals ).length > 0 ) {
		result.globals = globals;
	}
	if ( Object.keys( settings ).length > 0 ) {
		result.settings = settings;
	}
	if ( parser ) {
		result.parser = parser;
	}
	if ( Object.keys( parserOptions ).length > 0 ) {
		result.parserOptions = parserOptions;
	}
	if ( overrides.length > 0 ) {
		result.overrides = overrides;
	}

	return result;
}

const legacyConfigs = {};
for ( const [ key, value ] of Object.entries( plugin.configs ) ) {
	if ( Array.isArray( value ) ) {
		legacyConfigs[ key ] = flatToEslintrc( value );
	} else {
		legacyConfigs[ key ] = value;
	}
}

module.exports = {
	meta: plugin.meta,
	rules: plugin.rules,
	configs: legacyConfigs,
};
