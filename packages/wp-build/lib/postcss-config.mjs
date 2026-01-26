/**
 * External dependencies
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
// @ts-ignore - rtlcss doesn't have type definitions
import rtlcss from 'rtlcss';

/**
 * Internal dependencies
 */
import { getPackageInfoFromFile } from './package-utils.mjs';

/**
 * @typedef {Object} AutoprefixerOptions
 * @property {boolean}             [grid]    Enable/disable grid prefixes.
 * @property {boolean|'no-2009'}   [flexbox] Enable/disable flexbox prefixes.
 */

/**
 * @typedef {Object} CssnanoOptions
 * @property {Array<string|Object>} [preset] Cssnano preset configuration.
 */

/**
 * @typedef {Object} RtlcssOptions
 * @property {boolean} [autoRename] Enable/disable auto-renaming.
 */

/**
 * @typedef {Object} ModulesOptions
 * @property {string} [generateScopedName] Pattern for generating scoped class names.
 */

/**
 * @typedef {string|Function|[string, Object]} PluginConfig
 */

/**
 * @typedef {Object} PostcssConfigBase
 * @property {AutoprefixerOptions} [autoprefixer] Autoprefixer options.
 * @property {CssnanoOptions}      [cssnano]      Cssnano options.
 * @property {RtlcssOptions}       [rtlcss]       RTL CSS options.
 * @property {ModulesOptions}      [modules]      CSS modules options.
 * @property {PluginConfig[]}      [plugins]      Custom PostCSS plugins.
 */

/**
 * @typedef {PostcssConfigBase & Record<string, unknown>} PostcssConfig
 */

/**
 * @typedef {import('type-fest').PackageJson & { wpPostcss?: PostcssConfig }} ExtendedPackageJson
 */

/**
 * Supported PostCSS configuration file names in order of priority.
 */
const CONFIG_FILES = [
	'postcss.config.js',
	'postcss.config.cjs',
	'postcss.config.mjs',
	'.postcssrc',
	'.postcssrc.json',
	'.postcssrc.js',
	'.postcssrc.cjs',
	'.postcssrc.yaml',
	'.postcssrc.yml',
];

/**
 * Default PostCSS configuration.
 * These values are used when no custom configuration is provided.
 */
export const defaultPostcssConfig = {
	autoprefixer: { grid: true },
	cssnano: { preset: [ 'default', { discardComments: { removeAll: true } } ] },
	rtlcss: {},
	modules: { generateScopedName: '[name]__[local]__[hash:base64:5]' },
	plugins: [],
};

/**
 * Find a PostCSS configuration file in a directory.
 *
 * @param {string} dir Directory to search in.
 * @return {string|null} Path to the config file, or null if not found.
 */
export function findPostcssConfigFile( dir ) {
	for ( const filename of CONFIG_FILES ) {
		const configPath = path.join( dir, filename );
		if ( existsSync( configPath ) ) {
			return configPath;
		}
	}
	return null;
}

/**
 * Check if a directory has a PostCSS configuration.
 * Checks for config files and wpPostcss field in package.json.
 *
 * @param {string} dir Directory to check.
 * @return {boolean} True if config exists.
 */
export function hasPostcssConfig( dir ) {
	// Check for config file
	if ( findPostcssConfigFile( dir ) ) {
		return true;
	}

	// Check for wpPostcss in package.json
	const packageJsonPath = path.join( dir, 'package.json' );
	if ( existsSync( packageJsonPath ) ) {
		const packageJson =
			/** @type {ExtendedPackageJson|null} */ (
				getPackageInfoFromFile( packageJsonPath )
			);
		if ( packageJson && packageJson.wpPostcss ) {
			return true;
		}
	}

	return false;
}

/**
 * Load a PostCSS configuration file.
 * Supports JS (CommonJS/ESM), JSON, and YAML formats.
 *
 * @param {string} configPath Path to the config file.
 * @return {Promise<PostcssConfig>} Loaded configuration object.
 */
export async function loadPostcssConfigFile( configPath ) {
	const ext = path.extname( configPath ).toLowerCase();
	const basename = path.basename( configPath ).toLowerCase();

	// Handle JS/MJS/CJS files
	if ( ext === '.js' || ext === '.mjs' || ext === '.cjs' ) {
		const fileUrl = pathToFileURL( configPath ).href;
		const module = await import( fileUrl );
		return module.default || module;
	}

	// Handle JSON files (including .postcssrc without extension)
	if ( ext === '.json' || basename === '.postcssrc' ) {
		const content = readFileSync( configPath, 'utf8' );
		// Try parsing as JSON first
		try {
			return JSON.parse( content );
		} catch {
			// If .postcssrc fails to parse as JSON, it might be YAML
			if ( basename === '.postcssrc' ) {
				const yaml = await import( 'yaml' );
				return yaml.parse( content );
			}
			throw new Error( `Failed to parse JSON config: ${ configPath }` );
		}
	}

	// Handle YAML files
	if ( ext === '.yaml' || ext === '.yml' ) {
		const yaml = await import( 'yaml' );
		const content = readFileSync( configPath, 'utf8' );
		return yaml.parse( content );
	}

	throw new Error( `Unsupported PostCSS config format: ${ configPath }` );
}

/**
 * Get PostCSS configuration for a package.
 * Merges root-level config with package-level overrides from wpPostcss.
 *
 * @param {string} packageDir Directory of the package being built.
 * @param {string} rootDir    Root directory of the project.
 * @return {Promise<PostcssConfig>} Merged PostCSS configuration.
 */
export async function getPostcssConfig( packageDir, rootDir ) {
	/** @type {PostcssConfig} */
	let config = { ...defaultPostcssConfig };

	// Load root-level config if it exists
	const rootConfigPath = findPostcssConfigFile( rootDir );
	if ( rootConfigPath ) {
		const rootConfig = await loadPostcssConfigFile( rootConfigPath );
		config = mergePostcssConfigs( config, rootConfig );
	}

	// Load package-level overrides from package.json wpPostcss field
	const packageJsonPath = path.join( packageDir, 'package.json' );
	if ( existsSync( packageJsonPath ) ) {
		const packageJson =
			/** @type {ExtendedPackageJson|null} */ (
				getPackageInfoFromFile( packageJsonPath )
			);
		if ( packageJson && packageJson.wpPostcss ) {
			config = mergePostcssConfigs( config, packageJson.wpPostcss );
		}
	}

	return config;
}

/**
 * Deep merge two PostCSS configurations.
 * Override config values take precedence, arrays are concatenated.
 *
 * @param {PostcssConfig} base     Base configuration.
 * @param {PostcssConfig} override Override configuration.
 * @return {PostcssConfig} Merged configuration.
 */
export function mergePostcssConfigs( base, override ) {
	/** @type {PostcssConfig} */
	const result = { ...base };

	for ( const [ key, value ] of Object.entries( override ) ) {
		if ( key === 'plugins' ) {
			// Concatenate plugins arrays
			const basePlugins = base.plugins || [];
			const overridePlugins = /** @type {PluginConfig[]} */ ( value ) || [];
			result.plugins = [ ...basePlugins, ...overridePlugins ];
		} else if (
			typeof value === 'object' &&
			value !== null &&
			! Array.isArray( value )
		) {
			// Deep merge objects
			const baseValue = /** @type {Record<string, unknown>} */ ( base )[ key ] || {};
			// @ts-ignore - dynamic key assignment
			result[ key ] = {
				...baseValue,
				.../** @type {Record<string, unknown>} */ ( value ),
			};
		} else {
			// Direct assignment for primitives and arrays
			// @ts-ignore - dynamic key assignment
			result[ key ] = value;
		}
	}

	return result;
}

/**
 * Resolve a plugin from its name or configuration.
 * Handles both string names and plugin instances.
 *
 * @param {PluginConfig} plugin  Plugin name, instance, or [name, options] array.
 * @param {string}       rootDir Root directory of the project (for resolving plugins).
 * @return {Promise<Function>} Resolved PostCSS plugin instance.
 */
async function resolvePlugin( plugin, rootDir ) {
	// Already a function (plugin instance)
	if ( typeof plugin === 'function' ) {
		return plugin;
	}

	// Create require function that resolves from the project root
	const require = createRequire( path.join( rootDir, 'package.json' ) );

	// Array format: [pluginName, options]
	if ( Array.isArray( plugin ) ) {
		const [ name, options = {} ] = plugin;
		try {
			const resolvedPath = require.resolve( name );
			const pluginModule = await import( pathToFileURL( resolvedPath ).href );
			const pluginFn = pluginModule.default || pluginModule;
			return pluginFn( options );
		} catch ( error ) {
			const errorMessage = error instanceof Error ? error.message : String( error );
			throw new Error(
				`Failed to load PostCSS plugin "${ name }": ${ errorMessage }. ` +
				`Make sure the plugin is installed in your project.`
			);
		}
	}

	// String format: plugin name without options
	if ( typeof plugin === 'string' ) {
		try {
			const resolvedPath = require.resolve( plugin );
			const pluginModule = await import( pathToFileURL( resolvedPath ).href );
			const pluginFn = pluginModule.default || pluginModule;
			return pluginFn();
		} catch ( error ) {
			const errorMessage = error instanceof Error ? error.message : String( error );
			throw new Error(
				`Failed to load PostCSS plugin "${ plugin }": ${ errorMessage }. ` +
				`Make sure the plugin is installed in your project.`
			);
		}
	}

	throw new Error( `Invalid plugin format: ${ typeof plugin }` );
}

/**
 * Create PostCSS plugins array for a specific processing stage.
 *
 * Processing stages:
 * - 'ltr': autoprefixer + custom plugins (for LTR stylesheet, applied to source)
 * - 'rtl': rtlcss only (applied to LTR output to generate RTL stylesheet)
 * - 'minify': cssnano only (for minification)
 *
 * @param {PostcssConfig}          config  PostCSS configuration object.
 * @param {'ltr'|'rtl'|'minify'}   stage   Processing stage: 'ltr', 'rtl', or 'minify'.
 * @param {string}                 rootDir Root directory of the project (for resolving plugins).
 * @return {Promise<Array<Function>>} Array of PostCSS plugin instances.
 */
export async function createPostcssPlugins( config, stage, rootDir ) {
	const plugins = [];

	if ( stage === 'ltr' ) {
		// LTR stage: autoprefixer + custom plugins (applied to source)
		const autoprefixerOptions = config.autoprefixer || defaultPostcssConfig.autoprefixer;
		plugins.push( autoprefixer( autoprefixerOptions ) );

		// Add custom plugins
		if ( config.plugins && config.plugins.length > 0 ) {
			for ( const plugin of config.plugins ) {
				plugins.push( await resolvePlugin( plugin, rootDir ) );
			}
		}
	} else if ( stage === 'rtl' ) {
		// RTL stage: rtlcss only (applied to LTR output)
		const rtlcssOptions = config.rtlcss || defaultPostcssConfig.rtlcss;
		plugins.push( rtlcss( rtlcssOptions ) );
	} else if ( stage === 'minify' ) {
		// Minification stage: cssnano only
		const cssnanoOptions = config.cssnano || defaultPostcssConfig.cssnano;
		plugins.push( cssnano( cssnanoOptions ) );
	}

	return plugins;
}

/**
 * Get CSS modules configuration from PostCSS config.
 *
 * @param {PostcssConfig} config PostCSS configuration object.
 * @return {ModulesOptions} CSS modules configuration.
 */
export function getModulesConfig( config ) {
	return config.modules || defaultPostcssConfig.modules;
}
