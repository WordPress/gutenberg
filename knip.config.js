const { globSync } = require( 'node:fs' );
const path = require( 'node:path' );

const SOURCE_EXT = '{js,jsx,mjs,cjs,ts,tsx,mts,cts}';

// Mirrors `TEST_PATTERNS` in test/unit/scripts/discover-test-files.mjs.
const TEST_ENTRIES = [
	`**/__tests__/**/*.${ SOURCE_EXT }`,
	`**/test/*.${ SOURCE_EXT }`,
	`**/*.test.${ SOURCE_EXT }`,
];

const STORY_ENTRIES = [
	`**/stories/**/*.${ SOURCE_EXT }`,
	'**/stories/**/*.mdx',
];

// Stylesheets are compiled on their own, not imported from scripts.
const STYLE_ENTRIES = [ '**/*.scss' ];

/**
 * Collects the string targets of a package.json entry field, which may be a
 * path, a conditional exports object, or a map of subpaths.
 *
 * @param {unknown} field Field value.
 * @return {Array<string>} Paths.
 */
function collectTargets( field ) {
	if ( typeof field === 'string' ) {
		return [ field ];
	}
	if ( field && typeof field === 'object' ) {
		return Object.values( field ).flatMap( collectTargets );
	}
	return [];
}

/**
 * Maps the built entry points of a package back to their sources, since
 * Knip only infers `src` from a tsconfig `outDir`, which here is `build-types`.
 *
 * @param {string} workspaceDir Workspace directory, relative to the root.
 * @return {Array<string>} Source entry globs.
 */
function getSourceEntries( workspaceDir ) {
	const manifest = require( `./${ workspaceDir }/package.json` );
	return [
		manifest.main,
		manifest.module,
		manifest.exports,
		manifest.wpScriptModuleExports,
	]
		.flatMap( collectTargets )
		.map( ( target ) =>
			target.match( /^\.?\/?build(?:-module)?\/(.+)\.[cm]?js$/ )
		)
		.filter( Boolean )
		.map( ( [ , subpath ] ) => `src/${ subpath }.${ SOURCE_EXT }` );
}

const packageWorkspaces = Object.fromEntries(
	globSync( 'packages/*/package.json', { cwd: __dirname } ).map(
		( manifestPath ) => {
			const workspaceDir = path.dirname( manifestPath );
			return [
				workspaceDir,
				{
					entry: [
						...getSourceEntries( workspaceDir ),
						...TEST_ENTRIES,
						...STORY_ENTRIES,
						...STYLE_ENTRIES,
					],
				},
			];
		}
	)
);

/**
 * Appends entries to a generated package workspace.
 *
 * @param {string}        workspaceDir Workspace directory.
 * @param {Array<string>} entry        Extra entry globs.
 * @return {import('knip').WorkspaceProjectConfig} Workspace config.
 */
function withEntries( workspaceDir, entry ) {
	return {
		...packageWorkspaces[ workspaceDir ],
		entry: [ ...packageWorkspaces[ workspaceDir ].entry, ...entry ],
	};
}

/** @type {import('knip').KnipConfig} */
module.exports = {
	// Fixtures are read by tests from disk, not imported.
	ignore: [ '**/test/fixtures/**', '{phpunit,tools/validation}/fixtures/**' ],
	// Aliased in by `@wordpress/build` for packages that ship styles.
	ignoreDependencies: [ '@wordpress/style-runtime' ],
	compilers: {
		// Only scoped packages: other specifiers are Sass modules or partials.
		scss: ( text ) =>
			[
				...text.matchAll(
					/@(?:use|forward|import)\s+['"](@[^'"]+)['"]/g
				),
			]
				.map( ( [ , specifier ] ) => `import '${ specifier }';` )
				.join( '\n' ),
	},
	workspaces: {
		...packageWorkspaces,
		'packages/block-library': withEntries( 'packages/block-library', [
			// Deep imports through the `./build-module/*` export.
			`src/*/init.${ SOURCE_EXT }`,
		] ),
		'packages/e2e-tests': {
			// Enqueued by the PHP test plugins.
			entry: [ `plugins/**/*.${ SOURCE_EXT }` ],
		},
		'packages/eslint-plugin': {
			entry: [ 'index.js', 'rules/*.js', ...TEST_ENTRIES ],
		},
		'packages/scripts': {
			// `wp-scripts <name>` spawns `scripts/<name>.js`.
			entry: [ 'scripts/*.js', 'config/*', ...TEST_ENTRIES ],
		},
		// Discovered by `@wordpress/build`, see packages/wp-build/lib/route-utils.mjs.
		'routes/*': {
			entry: [
				`{route,stage,inspector,canvas}.${ SOURCE_EXT }`,
				...TEST_ENTRIES,
				...STYLE_ENTRIES,
			],
		},
		// Discovered by `@wordpress/build`, see packages/wp-build/lib/widget-utils.mjs.
		'widgets/*': {
			entry: [
				`{render,widget}.${ SOURCE_EXT }`,
				...TEST_ENTRIES,
				...STYLE_ENTRIES,
			],
		},
		storybook: {
			entry: [ ...TEST_ENTRIES, ...STORY_ENTRIES ],
			storybook: {
				config: [ 'main.ts' ],
				entry: [ '{manager,preview}.*' ],
			},
		},
		'test/storybook-playwright': {
			storybook: {
				config: [ 'storybook/main.ts' ],
				entry: [ 'storybook/preview.*' ],
			},
		},
		'test/e2e': {
			entry: [ 'playwright.*.ts', 'specs/**/*.spec.{js,ts}' ],
		},
	},
};
