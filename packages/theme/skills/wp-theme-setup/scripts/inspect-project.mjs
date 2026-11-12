#!/usr/bin/env node
/**
 * Inspect a project before setting up the WordPress Design System.
 *
 * Prints JSON with the package manager, Node.js and tool versions, linter
 * and build configuration, the installed WordPress packages, and which setup
 * steps already look done. It only reads files: no network access, no
 * commands run, and nothing is written.
 *
 * Config files are checked by searching their text, because they can be
 * JavaScript that is not safe to run. A step reported as `done: false` means
 * the text was not found, so confirm it before editing. `done: null` means
 * it could not be determined.
 *
 *   node inspect-project.mjs [--cwd <dir>]
 *
 * Requires Node.js 22.13 or later, like the WordPress Design System packages.
 */

import fs from 'node:fs';
import path from 'node:path';

const WORDPRESS_PACKAGES = [
	'@wordpress/theme',
	'@wordpress/ui',
	'@wordpress/components',
	'@wordpress/theme-build-tools',
	'@wordpress/eslint-plugin',
	'@wordpress/stylelint-config',
	'@wordpress/build',
	'@wordpress/scripts',
	'@wordpress/design-system-mcp',
];
const STYLELINT_RULES = [
	'plugin-wpds/no-unknown-ds-tokens',
	'plugin-wpds/no-setting-wpds-custom-properties',
	'plugin-wpds/no-token-fallback-values',
];
const SOURCE_EXTENSIONS = new Set( [
	'.js',
	'.jsx',
	'.ts',
	'.tsx',
	'.mjs',
	'.cjs',
	'.css',
	'.scss',
	'.php',
] );
const SKIPPED_DIRECTORIES = new Set( [
	'node_modules',
	'.git',
	'vendor',
	'build',
	'dist',
	'coverage',
	'.next',
	'.cache',
] );
const MAX_SCANNED_FILES = 4000;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_EXAMPLES = 3;

/**
 * @param {string} file Path to a file.
 * @return {string|null} The file text, or null when it cannot be read.
 */
function readText( file ) {
	try {
		return fs.readFileSync( file, 'utf8' );
	} catch {
		return null;
	}
}

/**
 * @param {string} file Path to a JSON file.
 * @return {Object|null} The parsed JSON, or null when it cannot be read.
 */
function readJson( file ) {
	const text = readText( file );
	if ( text === null ) {
		return null;
	}
	try {
		return JSON.parse( text );
	} catch {
		return null;
	}
}

/**
 * @param {string}   root  Directory to look in.
 * @param {string[]} names File names to look for.
 * @return {string[]} The names that exist in the directory.
 */
function existing( root, names ) {
	return names.filter( ( name ) => fs.existsSync( path.join( root, name ) ) );
}

/**
 * Finds the nearest directory with a package.json, starting at `start`.
 *
 * @param {string} start Directory to start from.
 * @return {string} The project root, or `start` when none is found.
 */
function findRoot( start ) {
	for ( let dir = start; ; dir = path.dirname( dir ) ) {
		if ( fs.existsSync( path.join( dir, 'package.json' ) ) ) {
			return dir;
		}
		if ( path.dirname( dir ) === dir ) {
			return start;
		}
	}
}

/**
 * Reads the installed version of a package, walking up like Node does.
 *
 * @param {string} root Project root.
 * @param {string} name Package name.
 * @return {string|null} The installed version, or null when not found.
 */
function installedVersion( root, name ) {
	for ( let dir = root; ; dir = path.dirname( dir ) ) {
		const json = readJson(
			path.join( dir, 'node_modules', name, 'package.json' )
		);
		if ( json?.version ) {
			return json.version;
		}
		if ( path.dirname( dir ) === dir ) {
			return null;
		}
	}
}

/**
 * Collects the text of a project's config files.
 *
 * @param {string}   root  Project root.
 * @param {string[]} names Config file names to read, if they exist.
 * @return {{ files: string[], text: string }} The files found and their text.
 */
function readConfigs( root, names ) {
	const files = existing( root, names );
	return {
		files,
		text: files
			.map( ( name ) => readText( path.join( root, name ) ) )
			.join( '\n' ),
	};
}

/**
 * Searches project source files for patterns.
 *
 * @param {string}                 root     Project root.
 * @param {Record<string, RegExp>} patterns Patterns by result name.
 * @return {{ examples: Record<string, string[]>, truncated: boolean }} Example files per pattern.
 */
function scanSource( root, patterns ) {
	const examples = Object.fromEntries(
		Object.keys( patterns ).map( ( key ) => [ key, [] ] )
	);
	let scanned = 0;
	let truncated = false;
	const queue = [ root ];
	while ( queue.length ) {
		const dir = queue.pop();
		let entries = [];
		try {
			entries = fs.readdirSync( dir, { withFileTypes: true } );
		} catch {
			continue;
		}
		for ( const entry of entries ) {
			const full = path.join( dir, entry.name );
			if ( entry.isDirectory() ) {
				if ( ! SKIPPED_DIRECTORIES.has( entry.name ) ) {
					queue.push( full );
				}
			} else if (
				entry.isFile() &&
				SOURCE_EXTENSIONS.has( path.extname( entry.name ) )
			) {
				if ( scanned >= MAX_SCANNED_FILES ) {
					truncated = true;
					continue;
				}
				scanned++;
				let text = null;
				try {
					if ( fs.statSync( full ).size <= MAX_FILE_BYTES ) {
						text = fs.readFileSync( full, 'utf8' );
					}
				} catch {
					// Skip unreadable files.
				}
				if ( text === null ) {
					continue;
				}
				for ( const [ key, pattern ] of Object.entries( patterns ) ) {
					if (
						examples[ key ].length < MAX_EXAMPLES &&
						pattern.test( text )
					) {
						examples[ key ].push( path.relative( root, full ) );
					}
				}
			}
		}
	}
	return { examples, truncated };
}

/**
 * @param {string} text Config text to search.
 * @param {string} term Text to look for.
 * @return {boolean} Whether the text contains the term.
 */
function mentions( text, term ) {
	return text.includes( term );
}

/**
 * Reports whether a rule step is done: true when found in the config, null
 * when there is no config to search, and false otherwise.
 *
 * @param {boolean}     found       Whether the config text mentions the rule.
 * @param {string|null} configStyle The ESLint config style, if any.
 * @return {boolean|null} The step status.
 */
function ruleStatus( found, configStyle ) {
	if ( found ) {
		return true;
	}
	return configStyle === null ? null : false;
}

/**
 * @param {string[]} files          Config files found.
 * @param {boolean}  hasLegacyField Whether package.json has an eslintConfig field.
 * @return {string|null} 'flat', 'eslintrc', or null when there is no config.
 */
function eslintConfigStyle( files, hasLegacyField ) {
	if ( files.some( ( name ) => name.startsWith( 'eslint.config.' ) ) ) {
		return 'flat';
	}
	const legacy =
		files.some( ( name ) => name.startsWith( '.eslintrc' ) ) ||
		hasLegacyField;
	return legacy ? 'eslintrc' : null;
}

function inspect( start ) {
	const root = findRoot( start );
	const pkg = readJson( path.join( root, 'package.json' ) ) ?? {};
	const dependencies = {
		...pkg.dependencies,
		...pkg.devDependencies,
		...pkg.peerDependencies,
		...pkg.optionalDependencies,
	};
	const notes = [];

	// Package manager.
	const lockfiles = existing( root, [
		'pnpm-lock.yaml',
		'package-lock.json',
		'npm-shrinkwrap.json',
		'yarn.lock',
		'bun.lock',
		'bun.lockb',
	] );
	const declaredManager = pkg.packageManager ?? null;
	const lockfileManagers = {
		'pnpm-lock.yaml': 'pnpm',
		'package-lock.json': 'npm',
		'npm-shrinkwrap.json': 'npm',
		'yarn.lock': 'yarn',
		'bun.lock': 'bun',
		'bun.lockb': 'bun',
	};
	const yarnrc = readText( path.join( root, '.yarnrc.yml' ) ) ?? '';
	const nodeLinker =
		yarnrc.match( /nodeLinker:\s*['"]?([\w-]+)/ )?.[ 1 ] ?? null;
	const pnp = existing( root, [ '.pnp.cjs', '.pnp.js' ] ).length > 0;
	if ( pnp && nodeLinker !== 'node-modules' ) {
		notes.push(
			"Yarn Plug'n'Play is in use, so installed versions cannot be read from node_modules and tools that scan node_modules will not find skills."
		);
	}
	const packageManager = {
		name:
			declaredManager?.split( '@' )[ 0 ] ??
			lockfileManagers[ lockfiles[ 0 ] ] ??
			null,
		declared: declaredManager,
		lockfiles,
		workspaces: Boolean(
			pkg.workspaces ||
			fs.existsSync( path.join( root, 'pnpm-workspace.yaml' ) )
		),
		yarnNodeLinker: nodeLinker,
		plugAndPlay: pnp,
	};

	// Node.js.
	const nvmrc = readText( path.join( root, '.nvmrc' ) )?.trim() ?? null;
	const node = {
		running: process.versions.node,
		required: pkg.engines?.node ?? null,
		nvmrc,
	};

	// ESLint.
	const eslintConfig = readConfigs( root, [
		'eslint.config.js',
		'eslint.config.mjs',
		'eslint.config.cjs',
		'eslint.config.ts',
		'eslint.config.mts',
		'eslint.config.cts',
		'.eslintrc',
		'.eslintrc.js',
		'.eslintrc.cjs',
		'.eslintrc.json',
		'.eslintrc.yml',
		'.eslintrc.yaml',
	] );
	const configStyle = eslintConfigStyle(
		eslintConfig.files,
		Boolean( pkg.eslintConfig )
	);
	const eslintText =
		eslintConfig.text + JSON.stringify( pkg.eslintConfig ?? '' );
	const eslint = {
		installed: installedVersion( root, 'eslint' ),
		configStyle,
		configFiles: eslintConfig.files,
		usesWordPressPlugin: mentions( eslintText, '@wordpress/eslint-plugin' ),
		useRecommendedComponents: mentions(
			eslintText,
			'use-recommended-components'
		),
		allowUseWithCaution: mentions( eslintText, 'allowUseWithCaution' ),
		suppressionsFile: fs.existsSync(
			path.join( root, 'eslint-suppressions.json' )
		),
	};

	// Stylelint.
	const stylelintConfig = readConfigs( root, [
		'.stylelintrc',
		'.stylelintrc.json',
		'.stylelintrc.yaml',
		'.stylelintrc.yml',
		'.stylelintrc.js',
		'.stylelintrc.cjs',
		'.stylelintrc.mjs',
		'stylelint.config.js',
		'stylelint.config.cjs',
		'stylelint.config.mjs',
		'stylelint.config.ts',
	] );
	const stylelintText =
		stylelintConfig.text + JSON.stringify( pkg.stylelint ?? '' );
	const stylelint = {
		installed: installedVersion( root, 'stylelint' ),
		configFiles: stylelintConfig.files,
		enabledTokenRules: STYLELINT_RULES.filter( ( rule ) =>
			mentions( stylelintText, rule )
		),
	};

	// Build tools.
	const postcssConfig = readConfigs( root, [
		'postcss.config.js',
		'postcss.config.cjs',
		'postcss.config.mjs',
		'postcss.config.ts',
		'.postcssrc',
		'.postcssrc.json',
		'.postcssrc.js',
	] );
	const viteConfig = readConfigs( root, [
		'vite.config.js',
		'vite.config.mjs',
		'vite.config.cjs',
		'vite.config.ts',
		'vite.config.mts',
	] );
	const buildConfigText =
		postcssConfig.text +
		viteConfig.text +
		readConfigs( root, [
			'webpack.config.js',
			'webpack.config.cjs',
			'webpack.config.mjs',
			'esbuild.config.js',
			'esbuild.config.mjs',
		] ).text +
		JSON.stringify( pkg.scripts ?? {} );
	const buildTools = {
		wordpressBuild: '@wordpress/build' in dependencies,
		wordpressScripts: '@wordpress/scripts' in dependencies,
		postcss: 'postcss' in dependencies || postcssConfig.files.length > 0,
		lightningcss: 'lightningcss' in dependencies,
		esbuild: 'esbuild' in dependencies,
		vite: 'vite' in dependencies || viteConfig.files.length > 0,
		webpack: 'webpack' in dependencies,
		configFiles: [ ...postcssConfig.files, ...viteConfig.files ],
	};

	// WordPress packages.
	const wordpressPackages = Object.fromEntries(
		WORDPRESS_PACKAGES.map( ( name ) => [
			name,
			{
				declared: dependencies[ name ] ?? null,
				installed: installedVersion( root, name ),
			},
		] )
	);

	// Source scan for how the tokens stylesheet is loaded.
	const { examples, truncated } = scanSource( root, {
		importsTokensStylesheet: /@wordpress\/theme\/design-tokens\.css/,
		enqueuesWpTheme: /['"]wp-theme['"]/,
		importsLegacyComponents: /from\s+['"]@wordpress\/components['"]/,
		importsUi: /from\s+['"]@wordpress\/ui['"]/,
	} );
	if ( truncated ) {
		notes.push(
			`Only the first ${ MAX_SCANNED_FILES } source files were searched.`
		);
	}

	const theme = wordpressPackages[ '@wordpress/theme' ];
	const ui = wordpressPackages[ '@wordpress/ui' ];
	const hasStylelintRules =
		stylelint.enabledTokenRules.length === STYLELINT_RULES.length;
	const steps = [
		{
			id: 'theme-installed',
			done: Boolean( theme.declared || theme.installed ),
			evidence: theme.installed ?? theme.declared,
		},
		{
			id: 'tokens-stylesheet-loaded',
			done:
				examples.importsTokensStylesheet.length > 0 ||
				examples.enqueuesWpTheme.length > 0
					? true
					: null,
			evidence: [
				...examples.importsTokensStylesheet,
				...examples.enqueuesWpTheme,
			],
			note: 'Not needed in standard WordPress admin and editor screens, where WordPress loads the wp-theme style handle.',
		},
		{
			id: 'theme-build-tools-installed',
			done: Boolean(
				wordpressPackages[ '@wordpress/theme-build-tools' ].declared
			),
			evidence:
				wordpressPackages[ '@wordpress/theme-build-tools' ].installed,
		},
		{
			id: 'stylelint-token-rules',
			done: hasStylelintRules,
			evidence: stylelint.enabledTokenRules,
		},
		{
			id: 'eslint-token-rules',
			done: ruleStatus( eslint.usesWordPressPlugin, eslint.configStyle ),
			evidence: eslint.configFiles,
			note: 'The @wordpress/no-unknown-ds-tokens and no-setting-ds-tokens rules are in the recommended preset of @wordpress/eslint-plugin.',
		},
		{
			id: 'token-fallbacks-at-build-time',
			done: buildTools.wordpressBuild
				? true
				: mentions( buildConfigText, 'ds-token-fallbacks' ),
			evidence: buildTools.wordpressBuild
				? '@wordpress/build applies the fallbacks automatically'
				: buildTools.configFiles,
		},
		{
			id: 'ui-installed',
			done: Boolean( ui.declared || ui.installed ),
			evidence: ui.installed ?? ui.declared,
		},
		{
			id: 'eslint-use-recommended-components',
			done: ruleStatus(
				eslint.useRecommendedComponents,
				eslint.configStyle
			),
			evidence: eslint.configFiles,
		},
		{
			id: 'eslint-suppressions-baseline',
			done: eslint.suppressionsFile,
			evidence: eslint.suppressionsFile
				? 'eslint-suppressions.json'
				: null,
		},
	];

	return {
		root,
		detection:
			'Config files are searched as text, not evaluated. Confirm any step reported as false or null.',
		packageManager,
		node,
		eslint,
		stylelint,
		buildTools,
		wordpressPackages,
		usage: {
			legacyComponentsImportedIn: examples.importsLegacyComponents,
			uiImportedIn: examples.importsUi,
		},
		agentSkillDirectories: existing( root, [
			'.claude/skills',
			'.agents/skills',
			'.ai/skills',
		] ),
		steps,
		notes,
	};
}

const args = process.argv.slice( 2 );
const cwdIndex = args.indexOf( '--cwd' );
if ( args.includes( '--help' ) || args.includes( '-h' ) ) {
	process.stdout.write( 'Usage: node inspect-project.mjs [--cwd <dir>]\n' );
} else {
	const start = path.resolve(
		cwdIndex >= 0 ? ( args[ cwdIndex + 1 ] ?? '.' ) : '.'
	);
	process.stdout.write( JSON.stringify( inspect( start ), null, 2 ) + '\n' );
}
