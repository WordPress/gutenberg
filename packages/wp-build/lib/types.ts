/**
 * PHP transformation options for copied files.
 */
export interface PhpTransforms {
	/**
	 * Prefix to add to function names.
	 */
	functionPrefix?: string;
	/**
	 * Suffix to add to class names.
	 */
	classSuffix?: string;
	/**
	 * List of functions to prefix.
	 */
	prefixFunctions?: string[];
	/**
	 * List of classes to suffix.
	 */
	suffixClasses?: string[];
	/**
	 * Priority for add_action calls.
	 */
	addActionPriority?: number;
	/**
	 * Suffix to add to output filenames.
	 */
	filenameSuffix?: string;
	/**
	 * Whether to flatten index.php files (e.g., button/index.php → button.php).
	 */
	flattenIndexFiles?: boolean;
}

/**
 * Configuration for copying files during build.
 */
export interface CopyFilesConfig {
	/**
	 * Glob patterns for files to copy.
	 */
	files: string[];
	/**
	 * Optional transformations to apply.
	 */
	transforms?: {
		php?: PhpTransforms;
	};
}

/**
 * Configuration for external package namespaces.
 */
export interface ExternalNamespace {
	/**
	 * Global variable name for the script (e.g., 'wp').
	 */
	scriptGlobal: string;
	/**
	 * Prefix for script handles (e.g., 'wp-').
	 */
	handlePrefix: string;
}

/**
 * Configuration for a single page in the plugin.
 */
export interface PageConfig {
	/**
	 * Unique page identifier/slug.
	 */
	id: string;
	/**
	 * Module IDs to initialize on page load.
	 */
	init?: string[];
	/**
	 * Page title.
	 */
	title?: string;
}

/**
 * WordPress plugin configuration in package.json.
 */
export interface WpPluginConfig {
	/**
	 * Plugin name.
	 */
	name?: string;
	/**
	 * Global variable name for scripts (e.g., 'wp'), or false to disable.
	 */
	scriptGlobal?: string | false;
	/**
	 * Package namespace (e.g., 'wordpress').
	 */
	packageNamespace?: string;
	/**
	 * Prefix for script/style handles.
	 */
	handlePrefix?: string;
	/**
	 * External package namespace configurations.
	 */
	externalNamespaces?: Record< string, ExternalNamespace >;
	/**
	 * Pages to generate.
	 */
	pages?: Array< string | PageConfig >;
}

/**
 * Route configuration for a package.
 */
export interface RouteConfig {
	/**
	 * URL path pattern for the route.
	 */
	path: string;
	/**
	 * Page ID(s) this route belongs to.
	 */
	page?: string | string[];
}

/**
 * Package.json structure with WordPress-specific fields.
 */
export interface PackageJson {
	/**
	 * Package name.
	 */
	name: string;
	/**
	 * Package version.
	 */
	version: string;
	/**
	 * Main entry point (CommonJS).
	 */
	main?: string;
	/**
	 * ES module entry point.
	 */
	module?: string;
	/**
	 * Package exports field.
	 */
	exports?: Record< string, string | Record< string, string > >;
	/**
	 * Whether to build as a WordPress script.
	 */
	wpScript?: boolean;
	/**
	 * WordPress script module exports configuration.
	 */
	wpScriptModuleExports?: string | Record< string, string >;
	/**
	 * Whether the package has a default export.
	 */
	wpScriptDefaultExport?: boolean;
	/**
	 * Extra dependencies for WordPress script.
	 */
	wpScriptExtraDependencies?: string[];
	/**
	 * SCSS entry point patterns for style compilation.
	 */
	wpStyleEntryPoints?: string[];
	/**
	 * Configuration for copying files during build.
	 */
	wpCopyFiles?: CopyFilesConfig;
	/**
	 * WordPress plugin configuration.
	 */
	wpPlugin?: WpPluginConfig;
}

/**
 * Package.json for route packages with route configuration.
 */
export interface RoutePackageJson extends PackageJson {
	/**
	 * Route configuration.
	 */
	route?: RouteConfig;
}

/**
 * Key-value map for PHP template replacements.
 */
export type PhpReplacements = Record< string, string >;
