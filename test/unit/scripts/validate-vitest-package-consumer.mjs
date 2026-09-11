import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire( import.meta.url );
const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const PACKAGES = [
	'wp-build',
	'style-runtime',
	'vitest-console',
	'vitest-preset-default',
	...( process.env.VITEST_CONSUMER_JEST
		? [ 'scripts', 'jest-console', 'jest-preset-default', 'eslint-plugin' ]
		: [] ),
];
const tempDirectory = realpathSync(
	mkdtempSync( path.join( tmpdir(), 'wordpress-vitest-consumer-' ) )
);
const stagedPackages = path.join( tempDirectory, 'staged-packages' );
const installedPackages = path.join( tempDirectory, 'node_modules' );
const CONSUMER_DEPENDENCIES = [
	'@babel/core',
	'@emotion/react',
	'@testing-library/dom',
	'@testing-library/jest-dom',
	'@testing-library/react',
	'@types/node',
	'vitest-browser-react',
	'vitest',
	'vite',
	'typescript',
	'playwright',
	'react',
	'react-dom',
];

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

function getInstalledVersion( packageName ) {
	return readJson( require.resolve( `${ packageName }/package.json` ) )
		.version;
}

function getConsumerSpecifier( packageName ) {
	const version = getInstalledVersion( packageName );

	if ( packageName === 'vite' ) {
		return process.env.VITEST_CONSUMER_VITE ?? version;
	}
	if ( packageName === 'typescript' ) {
		return `npm:@typescript/typescript6@${ version }`;
	}

	return version;
}

function assertIsolatedResolution( isolatedRequire, packageName ) {
	const resolvedPath = isolatedRequire.resolve(
		`${ packageName }/package.json`
	);
	const relativePath = path.relative(
		realpathSync( installedPackages ),
		realpathSync( resolvedPath )
	);

	assert.equal(
		path.isAbsolute( relativePath ) ||
			relativePath === '..' ||
			relativePath.startsWith( `..${ path.sep }` ),
		false,
		`${ packageName } resolved outside the isolated install: ${ resolvedPath }`
	);
}

function installPackedPackages( packedPackages ) {
	writeJson( path.join( tempDirectory, 'package.json' ), {
		name: 'wordpress-vitest-packed-consumer',
		private: true,
		type: 'module',
		dependencies: Object.fromEntries( [
			...Array.from( packedPackages.values(), ( packedPackage ) => [
				packedPackage.packageJson.name,
				`file:${ packedPackage.tarballPath }`,
			] ),
			...CONSUMER_DEPENDENCIES.map( ( packageName ) => [
				packageName,
				getConsumerSpecifier( packageName ),
			] ),
		] ),
	} );

	run(
		process.execPath,
		[
			process.env.npm_execpath,
			'install',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			'--package-lock=false',
		],
		{
			cwd: tempDirectory,
			env: {
				PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
			},
		}
	);

	const isolatedRequire = createRequire(
		path.join( tempDirectory, 'package.json' )
	);
	for ( const packageName of [
		...Array.from(
			packedPackages.values(),
			( packedPackage ) => packedPackage.packageJson.name
		),
		...CONSUMER_DEPENDENCIES,
		'vite',
		'vitest',
	] ) {
		assertIsolatedResolution( isolatedRequire, packageName );
	}

	// The staged source includes package self-tests which are intentionally not
	// part of the published tarballs. Remove it before consumer test discovery.
	rmSync( stagedPackages, { force: true, recursive: true } );
}

function runVitest( fixture, args, options = {} ) {
	return run(
		process.execPath,
		[ path.join( installedPackages, 'vitest/vitest.mjs' ), ...args ],
		{
			cwd: fixture,
			expectedStatus: options.expectedStatus,
		}
	);
}

function createBuiltStylePackage() {
	const packageDirectory = path.join(
		tempDirectory,
		'packages/test-style-fixture'
	);
	const sourceDirectory = path.join( packageDirectory, 'src' );

	mkdirSync( sourceDirectory, { recursive: true } );
	writeJson( path.join( packageDirectory, 'package.json' ), {
		name: '@wordpress/test-style-fixture',
		version: '1.0.0',
		type: 'module',
		main: 'build/index.cjs',
		module: 'build-module/index.mjs',
	} );
	writeFileSync(
		path.join( sourceDirectory, 'index.js' ),
		`import styles from './style.module.css';
import './ordinary.css';

export default styles;
`
	);
	writeFileSync(
		path.join( sourceDirectory, 'style.module.css' ),
		`@layer wp-build-test {
	.fixture {
		--wp-build-style-injection-test: true;
		color: var(--fixture-color, rgb(1, 2, 3));
	}
}
`
	);

	writeFileSync(
		path.join( sourceDirectory, 'ordinary.css' ),
		`.ordinary-fixture { background-color: rgb(4, 5, 6); }`
	);
	run(
		process.execPath,
		[ path.join( installedPackages, '@wordpress/build/lib/build.mjs' ) ],
		{ cwd: tempDirectory }
	);

	const installedFixture = path.join(
		installedPackages,
		'@wordpress/test-style-fixture'
	);
	cpSync( packageDirectory, installedFixture, { recursive: true } );
	cpSync(
		path.join( installedFixture, 'build-module/index.mjs' ),
		path.join( installedFixture, 'build-module/duplicate.mjs' )
	);
	assert.ok(
		existsSync( path.join( installedFixture, 'build-module/index.mjs' ) ),
		'wp-build did not create the style fixture module.'
	);
}

function createDefaultConsumer() {
	const fixture = tempDirectory;
	writeFileSync(
		path.join( fixture, 'vitest.config.mjs' ),
		`export { default } from '@wordpress/vitest-preset-default';`
	);
	writeFileSync(
		path.join( fixture, 'default.test.tsx' ),
		`import { css } from '@emotion/react';
import { expect, test } from 'vitest';
import builtStyles from '@wordpress/test-style-fixture';
import styles from './styles.module.css';

test( 'uses Node and native transforms by default', () => {
\tconst count: number = 2;
\tconst nodeStyle = css( { color: 'red' } );
\tconst element = <button css={ nodeStyle }>Save { count }</button>;

\texpect( typeof document ).toBe( 'undefined' );
\texpect( styles.primaryAction ).toBe( 'style-primary-action' );
\texpect( builtStyles.fixture ).toBeTruthy();
\texpect( element.props.children ).toEqual( [ 'Save ', 2 ] );
\texpect( nodeStyle.name ).toMatch( /nodeStyle/ );
\texpect( globalThis.SCRIPT_DEBUG ).toBe( true );
\tconsole.warn( 'expected warning' );
\texpect( console ).toHaveWarnedWith( 'expected warning' );
} );
`
	);
	writeFileSync(
		path.join( fixture, 'styles.module.css' ),
		'.primaryAction { width: 127px; }'
	);
	writeFileSync(
		path.join( fixture, 'environment.jsdom.test.js' ),
		`import { expect, test } from 'vitest';
import builtStyles from '@wordpress/test-style-fixture';
import styles from './styles.module.css';

test( 'selects jsdom and the stylesheet mock by filename', () => {
\texpect( styles.primaryAction ).toBe( 'style-primary-action' );
\texpect( document ).toBeDefined();
\texpect( window.matchMedia ).toBeUndefined();
\texpect( window.requestIdleCallback ).toBeUndefined();
\texpect( builtStyles.fixture ).toBeTruthy();
\texpect( document.head.textContent ).not.toContain( 'ordinary-fixture' );
\texpect( document.head.textContent ).not.toContain(
\t\t'--wp-build-style-injection-test'
\t);
} );
`
	);
	writeFileSync(
		path.join( fixture, 'values.browser.test.js' ),
		`import { expect, test } from 'vitest';
import styles from '@wordpress/test-style-fixture';

test( 'uses real CSS and native browser values', async () => {
\tconst element = document.createElement( 'div' );
\telement.className = styles.fixture + ' ordinary-fixture';
\tdocument.body.append( element );
\tawait new Promise( requestAnimationFrame );

\texpect( getComputedStyle( element ).color ).toBe( 'rgb(1, 2, 3)' );
\texpect( getComputedStyle( element ).backgroundColor ).toBe( 'rgb(4, 5, 6)' );
\texpect( typeof process ).toBe( 'undefined' );
\texpect( typeof ResizeObserver ).toBe( 'function' );
\texpect( CSS.supports( 'display', 'grid' ) ).toBe( true );
\texpect( window.matchMedia( '(min-width: 1px)' ).matches ).toBe( true );
\telement.style.setProperty( '--fixture-color', 'rgb(7, 8, 9)' );
\texpect( getComputedStyle( element ).color ).toBe( 'rgb(7, 8, 9)' );
\tconst injectedStyles = document.head.querySelectorAll( 'style[data-wp-hash]' ).length;
\texpect( injectedStyles ).toBe( 2 );
\tawait import( '@wordpress/test-style-fixture/build-module/duplicate.mjs' );
\texpect( document.head.querySelectorAll( 'style[data-wp-hash]' ).length ).toBe( injectedStyles );
\tconsole.warn( 'browser warning' );
\tawait expect( Promise.resolve( console ) ).resolves.toHaveWarnedWith( 'browser warning' );
\telement.remove();
} );
`
	);

	writeFileSync(
		path.join( fixture, 'emotion.browser.test.jsx' ),
		`/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';
import styles from './styles.module.css';

test( 'renders JSX, Emotion and CSS modules in Chromium', async () => {
	const buttonStyle = css( { color: 'rgb(11, 22, 33)' } );
	const screen = await render( <button className={ styles.primaryAction } css={ buttonStyle }>Save</button> );
	const button = screen.getByRole( 'button', { name: 'Save' } );
	await expect.element( button ).toBeVisible();
	expect( styles.primaryAction ).not.toBe( 'style-primary-action' );
	expect( getComputedStyle( button.element() ).color ).toBe( 'rgb(11, 22, 33)' );
	expect( button.element().getBoundingClientRect().width ).toBe( 127 );
} );`
	);

	const output = runVitest( fixture, [ '--run', '--reporter=verbose' ] );
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
	const failureOutput = runVitest(
		fixture,
		[ '--run', 'failure.test.js', '--project=node', '--reporter=verbose' ],
		{ expectedStatus: 1 }
	);
	assert.match( failureOutput, /failure\.test\.js/ );
	assert.match( failureOutput, /expected/ );
	assert.match( failureOutput, /actual/ );

	writeFileSync(
		path.join( fixture, 'console-failure.test.js' ),
		`import { afterEach, test } from 'vitest';
afterEach( () => console.error( 'unexpected teardown error' ) );
test( 'reports unasserted teardown output', () => {} );`
	);
	const consoleFailure = runVitest(
		fixture,
		[ '--run', 'console-failure.test.js', '--project=node' ],
		{ expectedStatus: 1 }
	);
	assert.match( consoleFailure, /unexpected teardown error/ );
	assert.match(
		consoleFailure,
		/console\.error\(\) should not be used unless explicitly expected/
	);
	return fixture;
}

function createConfiguredConsumer() {
	const fixture = tempDirectory;
	writeFileSync(
		path.join( fixture, 'vitest.config.mjs' ),
		`import wordpressConfig from '@wordpress/vitest-preset-default';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
\twordpressConfig,
\tdefineConfig( {
\t\ttest: {
\t\t\tsetupFiles: [ './setup.js' ],
\t\t},
\t} )
);
`
	);
	writeFileSync(
		path.join( fixture, 'setup.js' ),
		`import '@testing-library/jest-dom/vitest';
globalThis.consumerSetup = true;
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, vi } from 'vitest';

expect( globalThis.SCRIPT_DEBUG ).toBe( true );
beforeEach( () => vi.useFakeTimers() );
afterEach( cleanup );
`
	);
	writeFileSync(
		path.join( fixture, 'custom.jsdom.test.jsx' ),
		`import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

test( 'keeps Testing Library in a discovered consumer config', () => {
\trender( <button>Save</button> );

\texpect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeInTheDocument();
\texpect( globalThis.SCRIPT_DEBUG ).toBe( true );
\texpect( globalThis.consumerSetup ).toBe( true );
\texpect( vi.isFakeTimers() ).toBe( true );
\tconsole.info( 'configured warning' );
\texpect( console ).toHaveInformedWith( 'configured warning' );
} );
`
	);
	writeFileSync(
		path.join( fixture, 'types-check.ts' ),
		`import '@wordpress/vitest-console';
import { expect } from 'vitest';
import config from '@wordpress/vitest-preset-default';
import type { UserConfig } from 'vite';

const typedConfig: UserConfig = config;
void typedConfig;
const sync: void = expect( console ).toHaveWarnedWith( 'typed warning' );
const negated: void = expect( console ).not.toHaveErrored();
const resolved: Promise<void> = expect( Promise.resolve( console ) ).resolves.toHaveLogged();
const rejected: Promise<void> = expect( Promise.reject( console ) ).rejects.toHaveInformedWith( 'info' );
const polled: Promise<void> = expect.poll( () => console ).toHaveWarned();
// @ts-expect-error synchronous matchers do not return a promise
const invalidAsync: Promise<void> = expect( console ).toHaveLoggedWith( 'log' );
// @ts-expect-error asynchronous matchers do not return void
const invalidSync: void = expect( Promise.resolve( console ) ).resolves.toHaveErroredWith( 'error' );
void [ sync, negated, resolved, rejected, polled, invalidAsync, invalidSync ];
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

	const output = runVitest( fixture, [
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
			path.join( installedPackages, 'typescript/bin/tsc6' ),
			'--project',
			path.join( fixture, 'tsconfig.json' ),
		],
		{ cwd: fixture }
	);
}

function createCustomJsdomConsumer() {
	const fixture = tempDirectory;
	writeFileSync(
		path.join( fixture, 'vitest-custom.config.mjs' ),
		`import { defineConfig } from 'vitest/config';



export default defineConfig( {
	test: {
		environment: 'jsdom',
		globals: false,
		include: [ 'custom-style.jsdom.test.js' ],
	},
} );
`
	);
	writeFileSync(
		path.join( fixture, 'custom-style.jsdom.test.js' ),
		`import { expect, test } from 'vitest';
import builtStyles from '@wordpress/test-style-fixture';

test( 'keeps generated style injection disabled in a custom jsdom setup', () => {

	expect( builtStyles.fixture ).toBeTruthy();
	expect( document.head.textContent ).not.toContain( 'ordinary-fixture' );
	expect( document.head.textContent ).not.toContain(
		'--wp-build-style-injection-test'
	);
} );
`
	);

	const output = runVitest( fixture, [
		'--config=vitest-custom.config.mjs',
		'--run',
		'--reporter=verbose',
	] );
	assert.match(
		output,
		/keeps generated style injection disabled in a custom jsdom setup/
	);
}

function verifyJestTooling() {
	const fixture = path.join( tempDirectory, 'jest-consumer' );
	mkdirSync( fixture );
	writeJson( path.join( fixture, 'package.json' ), {
		private: true,
		type: 'commonjs',
	} );
	writeFileSync(
		path.join( fixture, 'legacy.test.js' ),
		`test( 'keeps the Jest runner, DOM, JSX and console matchers', () => {
	const button = <button>Save</button>;
	expect( button.props.children ).toBe( 'Save' );
	expect( document.createElement( 'button' ).tagName ).toBe( 'BUTTON' );
	expect( jest.fn() ).not.toHaveBeenCalled();
	console.warn( 'legacy warning' );
	expect( console ).toHaveWarnedWith( 'legacy warning' );
} );`
	);
	const output = run(
		process.execPath,
		[
			path.join(
				installedPackages,
				'@wordpress/scripts/bin/wp-scripts.js'
			),
			'test-unit-js',
			'--runInBand',
			'--watch=false',
		],
		{ cwd: fixture }
	);
	assert.match( output, /1 passed/ );
	const isolatedRequire = createRequire(
		path.join( tempDirectory, 'package.json' )
	);
	const lintConfig = isolatedRequire( '@wordpress/eslint-plugin' ).configs[
		'test-unit'
	];
	const rules = lintConfig.flatMap( ( config ) =>
		Object.keys( config.rules ?? {} )
	);
	assert.ok( rules.includes( 'jest/expect-expect' ) );
	assert.ok( ! rules.some( ( name ) => name.startsWith( 'vitest/' ) ) );
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
			'./setup-test-framework'
		],
		'./scripts/setup-test-framework.js'
	);

	installPackedPackages( packedPackages );
	createBuiltStylePackage();

	createDefaultConsumer();
	createConfiguredConsumer();
	createCustomJsdomConsumer();
	if ( process.env.VITEST_CONSUMER_JEST ) {
		verifyJestTooling();
	}

	console.log(
		'Validated packed @wordpress/build, @wordpress/style-runtime, @wordpress/vitest-console, @wordpress/vitest-preset-default consumer fixtures.'
	);
} finally {
	if ( process.env.VITEST_CONSUMER_KEEP ) {
		console.log( tempDirectory );
	} else {
		rmSync( tempDirectory, { force: true, recursive: true } );
	}
}
