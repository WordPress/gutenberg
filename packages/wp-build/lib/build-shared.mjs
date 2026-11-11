#!/usr/bin/env node
/**
 * Builds the libraries in package.json's `wpSharedModules` into shared script modules, pruned to its export list.
 */
import { readFileSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { createRequire } from 'node:module';
import glob from 'fast-glob';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { NodePackageImporter } from 'sass-embedded';
import { rolldown } from 'rolldown';
import { getBrowserslistQueries } from './browserslist.mjs';
import { compileInlineStyle } from './compile-inline-style.mjs';
import { compileStylesheet, disposeSassCompiler } from './sass-compiler.mjs';
import { createWordpressExternalsPlugin } from './wordpress-externals-plugin.mjs';
import {
	findSharedImports,
	readSharedModulesManifest,
} from './shared-modules-manifest.mjs';

const ROOT_DIR = process.cwd();
const manifest = await readSharedModulesManifest(
	path.join( ROOT_DIR, 'package.json' )
);
const { config } = manifest;
const outdir = path.join( ROOT_DIR, config.outdir );
const ENTRY_PREFIX = '\0shared-entry:';
// Bundling passes to try before failing on duplicate copies of a package.
const MAX_PASSES = 3;

const styleRuntimeEntry = path.join(
	path.dirname(
		createRequire( import.meta.url ).resolve(
			'@wordpress/style-runtime/package.json'
		)
	),
	'src/index.ts'
);
const sassOptions = {
	importers: [ new NodePackageImporter( ROOT_DIR ) ],
	loadPaths: [ path.join( ROOT_DIR, 'node_modules' ) ],
};

/**
 * Plugin compiling stylesheets into JS that injects them, as wp-build's own style plugins do.
 *
 * @param {RegExp}  filter     Stylesheets to compile.
 * @param {boolean} cssModules Whether they are CSS modules.
 * @return {import('rolldown').Plugin} Rolldown plugin.
 */
function stylePlugin( filter, cssModules ) {
	const transform = compileInlineStyle( { cssModules } );
	return {
		name: cssModules ? 'shared-css-modules' : 'shared-styles',
		load: {
			filter: { id: filter },
			async handler( id ) {
				const css = await compileStylesheet( id, sassOptions );
				return {
					code: await transform( css, path.dirname( id ), id ),
					moduleType: 'js',
					// Libraries like DataViews declare `sideEffects: false`, which would drop their stylesheet.
					moduleSideEffects: true,
				};
			},
		},
	};
}

/**
 * Whether a library has a default export, which `export *` leaves out.
 *
 * @param {string} specifier Bare specifier of the library.
 * @return {Promise<boolean>} Whether it has one.
 */
async function hasDefaultExport( specifier ) {
	const bundle = await rolldown( {
		input: specifier,
		cwd: ROOT_DIR,
		// Only the entry's own exports matter, and `export *` never re-exports a default.
		external: ( id, importer ) => !! importer,
		logLevel: 'silent',
	} );
	const { output } = await bundle.generate( { format: 'esm' } );
	await bundle.close();
	return output[ 0 ].exports.includes( 'default' );
}

/**
 * The directory of the installed package a module belongs to.
 *
 * @param {string} id Resolved module ID.
 * @return {string|undefined} Package directory, or undefined outside node_modules.
 */
function packageRoot( id ) {
	return id
		.replaceAll( '\\', '/' )
		.match( /^([^\0]*\/node_modules\/(?:@[^/]+\/)?[^/]+)\// )?.[ 1 ];
}

const packageKeys = new Map();
/**
 * Name and version of an installed package, plus pnpm's patch hash, so that only identical copies share a key.
 *
 * @param {string} root Package directory.
 * @return {string} Key.
 */
function packageKey( root ) {
	if ( ! packageKeys.has( root ) ) {
		const { name, version } = JSON.parse(
			readFileSync( path.join( root, 'package.json' ), 'utf8' )
		);
		const patch = root.match( /_patch_hash=[^_/]+/ )?.[ 0 ] ?? '';
		packageKeys.set( root, `${ name }@${ version }${ patch }` );
	}
	return packageKeys.get( root );
}

/**
 * Directories of each package version the output bundles more than one copy of.
 *
 * A package manager installs a package once per set of peer dependencies (pnpm, npm's linked strategy) or once per
 * conflicting parent (npm's nested installs), and bundling every copy splits React contexts and stores across modules.
 *
 * @param {import('rolldown').OutputBundle[]} output Bundle output.
 * @return {Map<string, string[]>} Sorted directories per package key.
 */
function findCopies( output ) {
	const copies = new Map();
	for ( const { moduleIds = [] } of output ) {
		for ( const id of moduleIds ) {
			const root = packageRoot( id );
			if ( root ) {
				const key = packageKey( root );
				if ( ! copies.has( key ) ) {
					copies.set( key, new Set() );
				}
				copies.get( key ).add( root );
			}
		}
	}
	return new Map(
		[ ...copies ]
			.filter( ( [ , roots ] ) => roots.size > 1 )
			.map( ( [ key, roots ] ) => [ key, [ ...roots ].sort() ] )
	);
}

// Only adds names: a plugin bundling an older copy of the provider may still import one.
if ( process.argv.includes( '--update-exports' ) ) {
	const ids = new Set( Object.keys( manifest.names ) );
	const used = {};
	for ( const [ name, names ] of Object.entries( manifest.exports ) ) {
		used[ name ] = new Set( names );
	}
	const files = await glob( config.consumers ?? [], {
		cwd: ROOT_DIR,
		absolute: true,
	} );
	if ( ! files.length ) {
		throw new Error(
			'No built consumers match `wpSharedModules.consumers`; build them first.'
		);
	}
	for ( const file of files ) {
		for ( const [ id, names ] of findSharedImports(
			await readFile( file, 'utf8' ),
			ids
		) ) {
			const name = manifest.names[ id ];
			used[ name ] ??= new Set();
			names.forEach( ( imported ) => used[ name ].add( imported ) );
		}
	}
	manifest.exports = Object.fromEntries(
		Object.keys( used )
			.sort()
			.map( ( name ) => [ name, [ ...used[ name ] ].sort() ] )
	);
	await writeFile(
		manifest.exportsPath,
		JSON.stringify( manifest.exports, null, '\t' ) + '\n'
	);
}

// One entry per module the list names; the others are not built.
const entries = {};
for ( const [ specifier, name ] of Object.entries( config.modules ) ) {
	const listed = manifest.exports[ name ];
	if ( ! listed ) {
		continue;
	}
	const from = JSON.stringify( specifier );
	const all = listed.includes( '*' );
	const named = listed.filter( ( n ) => n !== '*' && n !== 'default' );
	const lines = [];
	if ( all ) {
		lines.push( `export * from ${ from };` );
	} else if ( named.length ) {
		lines.push( `export { ${ named.join( ', ' ) } } from ${ from };` );
	}
	if (
		listed.includes( 'default' ) ||
		( all && ( await hasDefaultExport( specifier ) ) )
	) {
		lines.push( `export { default } from ${ from };` );
	}
	for ( const style of config.styles?.[ name ] ?? [] ) {
		lines.push( `import ${ JSON.stringify( style ) };` );
	}
	entries[ name ] = lines.join( '\n' );
}
if ( ! Object.keys( entries ).length ) {
	throw new Error(
		`${ manifest.exportsPath } lists no exports; run \`wp-build-shared --update-exports\`.`
	);
}

const outputOptions = {
	dir: outdir,
	format: 'esm',
	minify: true,
	entryFileNames: '[name].js',
	chunkFileNames: 'chunk-[hash].js',
	hashCharacters: 'hex',
};

/**
 * Bundle the entries, reading each package directory in `canonical` from the directory it maps to.
 *
 * @param {Map<string, string>} canonical Package directory to use in place of each other copy's.
 * @return {Promise<Object>} The bundle and its externals plugin.
 */
async function createBundle( canonical ) {
	const externals = createWordpressExternalsPlugin( 'wordpress', 'wp' )(
		'shared.min',
		'esm',
		[],
		false
	);
	const bundle = await rolldown( {
		input: Object.fromEntries(
			Object.keys( entries ).map( ( name ) => [
				`${ name }.min`,
				ENTRY_PREFIX + name,
			] )
		),
		cwd: ROOT_DIR,
		platform: 'browser',
		// An unbuilt library would otherwise become an import of a bare specifier the browser can't resolve.
		onLog( level, log, handler ) {
			if ( log.code === 'UNRESOLVED_IMPORT' ) {
				throw new Error( log.message );
			}
			handler( level, log );
		},
		moduleTypes: { '.svg': 'dataurl' },
		checks: { moduleLevelDirective: false },
		resolve: { conditionNames: [ 'module', 'browser', 'default' ] },
		transform: {
			target: browserslistToEsbuild( getBrowserslistQueries() ),
			jsx: { runtime: 'automatic', importSource: 'react' },
			define: {
				'process.env.NODE_ENV': '"production"',
				'process.env.IS_GUTENBERG_PLUGIN': 'false',
				'process.env.IS_WORDPRESS_CORE': 'false',
				'globalThis.IS_GUTENBERG_PLUGIN': 'false',
				'globalThis.IS_WORDPRESS_CORE': 'false',
				'globalThis.SCRIPT_DEBUG': 'false',
			},
		},
		plugins: [
			{
				name: 'shared-entries',
				resolveId: {
					filter: { id: /^\0shared-entry:/ },
					handler: ( id ) => id,
				},
				load: {
					filter: { id: /^\0shared-entry:/ },
					handler: ( id ) => ( {
						code: entries[ id.slice( ENTRY_PREFIX.length ) ],
						moduleType: 'js',
					} ),
				},
			},
			{
				name: 'style-runtime-alias',
				resolveId: {
					filter: { id: /^@wordpress\/style-runtime$/ },
					handler: () => styleRuntimeEntry,
				},
			},
			{
				name: 'single-copy',
				resolveId: {
					filter: { id: /^[@\w]/ },
					async handler( source, importer, options ) {
						const resolved = await this.resolve( source, importer, {
							...options,
							skipSelf: true,
						} );
						const root =
							! resolved?.external &&
							packageRoot( resolved?.id ?? '' );
						const target = root && canonical.get( root );
						if ( ! target ) {
							return resolved;
						}
						return {
							...resolved,
							id:
								target +
								resolved.id
									.replaceAll( '\\', '/' )
									.slice( root.length ),
						};
					},
				},
			},
			stylePlugin( /\.module\.(css|scss)$/, true ),
			stylePlugin( /(?<!\.module)\.(css|scss)$/, false ),
			externals,
		],
	} );
	return { bundle, externals };
}

/*
 * Bundle, then rebundle reading each package version from one directory, the first by name, until the output holds
 * one copy of each. Copies of one version differ only in which peer dependencies they resolve.
 */
const canonical = new Map();
let bundle, externals, output;
for ( let pass = 1; ; pass++ ) {
	( { bundle, externals } = await createBundle( canonical ) );
	( { output } = await bundle.generate( outputOptions ) );
	const copies = findCopies( output );
	if ( ! copies.size ) {
		break;
	}
	await bundle.close();
	if ( pass === MAX_PASSES ) {
		throw new Error(
			`Bundled more than one copy of ${ [ ...copies.keys() ].join(
				', '
			) }.`
		);
	}
	for ( const [ first, ...others ] of copies.values() ) {
		others.forEach( ( root ) => canonical.set( root, first ) );
	}
}

await rm( outdir, { recursive: true, force: true } );
await mkdir( outdir, { recursive: true } );
await bundle.write( outputOptions );
await bundle.close();
await disposeSassCompiler();

const files = output.map( ( { fileName } ) => fileName ).sort();
const hash = createHash( 'sha256' );
for ( const file of files ) {
	hash.update( await readFile( path.join( outdir, file ) ) );
}
const version = hash.digest( 'hex' ).slice( 0, 20 );

const { dependencies, moduleDependencies } = externals.api.getDependencies();
const phpModules = Object.entries( config.modules )
	.filter( ( [ , name ] ) => name in entries )
	.map(
		( [ specifier, name ] ) =>
			`'${ manifest.modules[ specifier ] }' => '${ name }.min.js'`
	)
	.join( ', ' );
const parts = [
	`'modules' => array( ${ phpModules } )`,
	`'dependencies' => array(${ dependencies
		.map( ( dep ) => `'${ dep }'` )
		.join( ', ' ) })`,
];
if ( moduleDependencies.length ) {
	parts.push(
		`'module_dependencies' => array(${ moduleDependencies
			.map(
				( dep ) =>
					`array('id' => '${ dep.id }', 'import' => '${ dep.import }')`
			)
			.join( ', ' ) })`
	);
}
parts.push( `'version' => '${ version }'` );
await writeFile(
	path.join( outdir, 'modules.php' ),
	`<?php return array( ${ parts.join( ', ' ) } );\n`
);

for ( const { fileName, code } of output ) {
	console.log(
		`   ${ fileName } ${ Math.floor( ( code?.length ?? 0 ) / 1024 ) }K`
	);
}
