import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire( import.meta.url );
const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const PACKAGES = [ 'vitest-console', 'vitest-preset-default', 'scripts' ];
const tempRoot = path.join( ROOT_DIR, 'node_modules/.cache' );
mkdirSync( tempRoot, { recursive: true } );
const tempDirectory = mkdtempSync(
	path.join( tempRoot, 'wordpress-vitest-consumer-' )
);
const npmCache = path.join( tempDirectory, 'npm-cache' );
const stagedPackages = path.join( tempDirectory, 'staged-packages' );
const installedPackages = path.join( tempDirectory, 'node_modules' );

function run( command, args, options = {} ) {
	const result = spawnSync( command, args, {
		cwd: options.cwd ?? ROOT_DIR,
		encoding: 'utf8',
		env: {
			...process.env,
			...options.env,
		},
		maxBuffer: 20 * 1024 * 1024,
	} );

	if ( options.expectedStatus !== undefined ) {
		assert.equal(
			result.status,
			options.expectedStatus,
			[
				`Expected exit status ${ options.expectedStatus }, received ${ result.status }.`,
				result.stdout,
				result.stderr,
			].join( '\n' )
		);
	} else if ( result.status !== 0 ) {
		throw new Error(
			[
				`Command failed: ${ command } ${ args.join( ' ' ) }`,
				result.stdout,
				result.stderr,
			].join( '\n' )
		);
	}

	return `${ result.stdout ?? '' }\n${ result.stderr ?? '' }`;
}

function readJson( filePath ) {
	return JSON.parse( readFileSync( filePath, 'utf8' ) );
}

function writeJson( filePath, value ) {
	writeFileSync( filePath, JSON.stringify( value, null, '\t' ) + '\n' );
}

function resolvePackageBin( packageName, binName = packageName ) {
	const packageJsonPath = require.resolve( `${ packageName }/package.json` );
	const packageJson = readJson( packageJsonPath );
	const binPath =
		typeof packageJson.bin === 'string'
			? packageJson.bin
			: packageJson.bin[ binName ];

	return path.resolve( path.dirname( packageJsonPath ), binPath );
}

function getWorkspaceVersions() {
	return new Map(
		readdirSync( path.join( ROOT_DIR, 'packages' ), {
			withFileTypes: true,
		} )
			.filter( ( entry ) => entry.isDirectory() )
			.map( ( entry ) =>
				path.join( ROOT_DIR, 'packages', entry.name, 'package.json' )
			)
			.filter( existsSync )
			.map( ( packageJsonPath ) => {
				const packageJson = readJson( packageJsonPath );
				return [ packageJson.name, packageJson.version ];
			} )
	);
}

function rewritePublishedDependencies( packageJson, workspaceVersions ) {
	for ( const dependencyType of [
		'dependencies',
		'optionalDependencies',
		'peerDependencies',
	] ) {
		for ( const [ name, specifier ] of Object.entries(
			packageJson[ dependencyType ] ?? {}
		) ) {
			if ( ! specifier.startsWith( 'file:' ) ) {
				continue;
			}

			const version = workspaceVersions.get( name );
			assert.ok(
				version,
				`Unable to resolve the workspace version for ${ name }.`
			);
			// Lerna uses its default save prefix when it replaces local
			// directory links immediately before publishing.
			packageJson[ dependencyType ][ name ] = `^${ version }`;
		}
	}
}

function packPackage( packageName, workspaceVersions ) {
	const sourceDirectory = path.join( ROOT_DIR, 'packages', packageName );
	const stageDirectory = path.join( stagedPackages, packageName );
	const tarballDirectory = path.join( tempDirectory, 'tarballs' );

	cpSync( sourceDirectory, stageDirectory, { recursive: true } );
	const packageJsonPath = path.join( stageDirectory, 'package.json' );
	const packageJson = readJson( packageJsonPath );
	rewritePublishedDependencies( packageJson, workspaceVersions );
	writeJson( packageJsonPath, packageJson );
	mkdirSync( tarballDirectory, { recursive: true } );

	const output = run(
		process.execPath,
		[
			process.env.npm_execpath,
			'pack',
			'--json',
			'--pack-destination',
			tarballDirectory,
		],
		{
			cwd: stageDirectory,
			env: {
				npm_config_cache: npmCache,
			},
		}
	);
	const [ packed ] = JSON.parse( output.trim() );
	const tarballPath = path.join( tarballDirectory, packed.filename );

	assert.ok( existsSync( tarballPath ), `${ tarballPath } was not created.` );
	for ( const dependencyType of [
		'dependencies',
		'optionalDependencies',
		'peerDependencies',
	] ) {
		assert.equal(
			Object.values( packageJson[ dependencyType ] ?? {} ).some(
				( specifier ) => specifier.startsWith( 'file:' )
			),
			false,
			`${ packageJson.name } contains a local ${ dependencyType } link.`
		);
	}

	return { packageJson, tarballPath };
}

function installTarball( packageName, tarballPath ) {
	const target = path.join( installedPackages, '@wordpress', packageName );

	mkdirSync( target, { recursive: true } );
	run(
		'tar',
		[ '-xzf', tarballPath, '--directory', target, '--strip-components=1' ],
		{ cwd: tempDirectory }
	);
}

function runWpScripts( fixture, args, options = {} ) {
	return run(
		process.execPath,
		[
			path.join(
				installedPackages,
				'@wordpress/scripts/bin/wp-scripts.js'
			),
			'test-unit-js',
			...args,
		],
		{
			cwd: fixture,
			expectedStatus: options.expectedStatus,
		}
	);
}

function createDefaultConsumer() {
	const fixture = path.join( tempDirectory, 'default-consumer' );

	mkdirSync( fixture );
	writeJson( path.join( fixture, 'package.json' ), {
		name: 'vitest-default-consumer',
		private: true,
		type: 'module',
	} );
	writeFileSync(
		path.join( fixture, 'default.test.tsx' ),
		`import { css } from '@emotion/react';
import { expect, test } from 'vitest';

test( 'uses Node and native transforms by default', () => {
\tconst count: number = 2;
\tconst nodeStyle = css( { color: 'red' } );
\tconst element = <button css={ nodeStyle }>Save { count }</button>;

\texpect( typeof document ).toBe( 'undefined' );
\texpect( element.props.children ).toEqual( [ 'Save ', 2 ] );
\texpect( nodeStyle.name ).toMatch( /nodeStyle/ );
\texpect( globalThis.SCRIPT_DEBUG ).toBe( true );
\tconsole.warn( 'expected warning' );
\texpect( console ).toHaveWarnedWith( 'expected warning' );
} );
`
	);
	writeFileSync( path.join( fixture, 'styles.module.scss' ), '' );
	writeFileSync(
		path.join( fixture, 'environment.jsdom.test.jsx' ),
		`import { expect, test } from 'vitest';
import styles from './styles.module.scss';

test( 'selects jsdom and the stylesheet mock by filename', () => {
\tconst element = <button className={ styles.primaryAction }>Save</button>;

\texpect( element.props.className ).toBe( 'style-primary-action' );
\texpect( document ).toBeDefined();
\texpect( window.matchMedia( 'screen' ).matches ).toBe( false );
} );
`
	);
	writeFileSync(
		path.join( fixture, 'browser-values.css' ),
		`.browser-value {
\tbox-sizing: border-box;
\twidth: 120px;
\theight: 20px;
}
`
	);
	writeFileSync(
		path.join( fixture, 'values.browser.test.js' ),
		`import { expect, test } from 'vitest';
import './browser-values.css';

test( 'uses real CSS and native browser values', async () => {
\tconst element = document.createElement( 'div' );
\telement.className = 'browser-value';
\tdocument.body.append( element );
\tawait new Promise( requestAnimationFrame );

\texpect( getComputedStyle( element ).width ).toBe( '120px' );
\texpect( element.getBoundingClientRect().width ).toBe( 120 );
\texpect( window.matchMedia( '(min-width: 1px)' ).matches ).toBe( true );
\telement.remove();
} );
`
	);

	const output = runWpScripts( fixture, [ '--run', '--reporter=verbose' ] );
	assert.match( output, /uses Node and native transforms by default/ );
	assert.match( output, /selects jsdom and the stylesheet mock by filename/ );
	assert.match( output, /uses real CSS and native browser values/ );

	writeFileSync(
		path.join( fixture, 'failure.test.js' ),
		`import { expect, test } from 'vitest';

test( 'shows useful failure output', () => {
\texpect( 'actual' ).toBe( 'expected' );
} );
`
	);
	const failureOutput = runWpScripts(
		fixture,
		[ '--run', 'failure.test.js', '--project=node', '--reporter=verbose' ],
		{ expectedStatus: 1 }
	);
	assert.match( failureOutput, /failure\.test\.js/ );
	assert.match( failureOutput, /expected/ );
	assert.match( failureOutput, /actual/ );

	return fixture;
}

function createConfiguredConsumer() {
	const fixture = path.join( tempDirectory, 'configured-consumer' );

	mkdirSync( fixture );
	writeJson( path.join( fixture, 'package.json' ), {
		name: 'vitest-configured-consumer',
		private: true,
		type: 'module',
	} );
	writeFileSync(
		path.join( fixture, 'vitest-unit.config.mjs' ),
		`import wordpressConfig from '@wordpress/vitest-preset-default';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
\twordpressConfig,
\tdefineConfig( {
\t\ttest: {
\t\t\ttestTimeout: 10000,
\t\t},
\t} )
);
`
	);
	writeFileSync(
		path.join( fixture, 'setup.js' ),
		`import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach( cleanup );
`
	);
	writeFileSync(
		path.join( fixture, 'custom.jsdom.test.jsx' ),
		`import './setup.js';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

test( 'keeps Testing Library in a discovered consumer config', () => {
\trender( <button>Save</button> );

\texpect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeInTheDocument();
\texpect( globalThis.SCRIPT_DEBUG ).toBe( true );
\tconsole.info( 'configured warning' );
\texpect( console ).toHaveInformedWith( 'configured warning' );
} );
`
	);
	writeFileSync(
		path.join( fixture, 'types-check.ts' ),
		`import '@wordpress/vitest-console';
import { expect } from 'vitest';

expect( console ).toHaveWarnedWith( 'typed warning' );
`
	);
	writeJson( path.join( fixture, 'tsconfig.json' ), {
		compilerOptions: {
			lib: [ 'DOM', 'ES2022' ],
			module: 'NodeNext',
			moduleResolution: 'NodeNext',
			noEmit: true,
			strict: true,
			target: 'ES2022',
		},
		include: [ 'types-check.ts' ],
	} );

	const output = runWpScripts( fixture, [
		'--run',
		'--project=jsdom',
		'--reporter=verbose',
	] );
	assert.match(
		output,
		/keeps Testing Library in a discovered consumer config/
	);
	run(
		process.execPath,
		[
			resolvePackageBin( '@typescript/native', 'tsc' ),
			'--project',
			path.join( fixture, 'tsconfig.json' ),
		],
		{ cwd: fixture }
	);
}

try {
	assert.ok(
		process.env.npm_execpath,
		'Run this validator through npm so npm_execpath is available.'
	);
	mkdirSync( stagedPackages, { recursive: true } );
	const workspaceVersions = getWorkspaceVersions();
	const packedPackages = new Map(
		PACKAGES.map( ( packageName ) => [
			packageName,
			packPackage( packageName, workspaceVersions ),
		] )
	);

	assert.equal(
		packedPackages.get( 'vitest-console' ).packageJson.exports[ '.' ].types,
		'./index.d.ts'
	);
	assert.equal(
		packedPackages.get( 'vitest-preset-default' ).packageJson.type,
		'module'
	);
	assert.equal(
		packedPackages.get( 'vitest-preset-default' ).packageJson.exports[
			'./setup-browser'
		],
		'./scripts/setup-browser.js'
	);
	assert.equal(
		packedPackages.get( 'scripts' ).packageJson.engines.node,
		'^20.19.0 || >=22.12.0'
	);

	for ( const [ packageName, { tarballPath } ] of packedPackages ) {
		installTarball( packageName, tarballPath );
	}

	createDefaultConsumer();
	createConfiguredConsumer();

	console.log(
		'Validated packed @wordpress/vitest-console, @wordpress/vitest-preset-default, and @wordpress/scripts consumer fixtures.'
	);
} finally {
	rmSync( tempDirectory, { force: true, recursive: true } );
}
