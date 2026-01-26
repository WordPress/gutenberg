/**
 * External dependencies
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import rtlcss from 'rtlcss';

/**
 * Internal dependencies
 */
import { getPackageInfoFromFile } from './package-utils.mjs';

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
		const packageJson = getPackageInfoFromFile( packageJsonPath );
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
 * @return {Promise<Object>} Loaded configuration object.
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
 * @return {Promise<Object>} Merged PostCSS configuration.
 */
export async function getPostcssConfig( packageDir, rootDir ) {
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
		const packageJson = getPackageInfoFromFile( packageJsonPath );
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
 * @param {Object} base     Base configuration.
 * @param {Object} override Override configuration.
 * @return {Object} Merged configuration.
 */
export function mergePostcssConfigs( base, override ) {
	const result = { ...base };

	for ( const [ key, value ] of Object.entries( override ) ) {
		if ( key === 'plugins' ) {
			// Concatenate plugins arrays
			result.plugins = [ ...( base.plugins || [] ), ...( value || [] ) ];
		} else if (
			typeof value === 'object' &&
			value !== null &&
			! Array.isArray( value )
		) {
			// Deep merge objects
			result[ key ] = {
				...( base[ key ] || {} ),
				...value,
			};
		} else {
			// Direct assignment for primitives and arrays
			result[ key ] = value;
		}
	}

	return result;
}

/**
 * Resolve a plugin from its name or configuration.
 * Handles both string names and plugin instances.
 *
 * @param {string|Function|Array} plugin  Plugin name, instance, or [name, options] array.
 * @param {string}                rootDir Root directory of the project (for resolving plugins).
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
		// Resolve from project directory using require.resolve, then import
		const resolvedPath = require.resolve( name );
		const pluginModule = await import( pathToFileURL( resolvedPath ).href );
		const pluginFn = pluginModule.default || pluginModule;
		return pluginFn( options );
	}

	// String format: plugin name without options
	if ( typeof plugin === 'string' ) {
		const resolvedPath = require.resolve( plugin );
		const pluginModule = await import( pathToFileURL( resolvedPath ).href );
		const pluginFn = pluginModule.default || pluginModule;
		return pluginFn();
	}

	throw new Error( `Invalid plugin format: ${ typeof plugin }` );
}

/**
 * Create PostCSS plugins array for a specific processing stage.
 *
 * Processing stages:
 * - 'ltr': autoprefixer + custom plugins (for LTR stylesheet)
 * - 'rtl': autoprefixer + custom plugins + rtlcss (for RTL stylesheet)
 * - 'minify': cssnano only (for minification)
 *
 * @param {Object} config  PostCSS configuration object.
 * @param {string} stage   Processing stage: 'ltr', 'rtl', or 'minify'.
 * @param {string} rootDir Root directory of the project (for resolving plugins).
 * @return {Promise<Function[]>} Array of PostCSS plugin instances.
 */
export async function createPostcssPlugins( config, stage, rootDir ) {
	const plugins = [];

	if ( stage === 'ltr' || stage === 'rtl' ) {
		// Add autoprefixer with config options
		const autoprefixerOptions = config.autoprefixer || defaultPostcssConfig.autoprefixer;
		plugins.push( autoprefixer( autoprefixerOptions ) );

		// Add custom plugins
		if ( config.plugins && config.plugins.length > 0 ) {
			for ( const plugin of config.plugins ) {
				plugins.push( await resolvePlugin( plugin, rootDir ) );
			}
		}

		// Add rtlcss for RTL processing
		if ( stage === 'rtl' ) {
			const rtlcssOptions = config.rtlcss || defaultPostcssConfig.rtlcss;
			plugins.push( rtlcss( rtlcssOptions ) );
		}
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
 * @param {Object} config PostCSS configuration object.
 * @return {Object} CSS modules configuration.
 */
export function getModulesConfig( config ) {
	return config.modules || defaultPostcssConfig.modules;
}
