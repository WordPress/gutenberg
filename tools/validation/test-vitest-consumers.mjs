#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs( {
	options: {
		vite: { type: 'string', default: '8.2.2' },
		node: { type: 'string', default: process.execPath },
		browser: { type: 'boolean', default: false },
		scripts: { type: 'string' },
		'eslint-plugin': { type: 'string' },
		lockfile: { type: 'string' },
	},
} );
const root = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const directory = mkdtempSync( path.join( tmpdir(), 'wp-vitest-consumer-' ) );
const consumer = path.join( directory, 'consumer' );
mkdirSync( consumer );
const env = {
	...process.env,
	PATH: `${ path.dirname( values.node ) }${ path.delimiter }${
		process.env.PATH
	}`,
	CI: 'true',
	NO_COLOR: '1',
};
// Do not inherit repository-specific runner options in the isolated consumer.
delete env.NODE_OPTIONS;
delete env.NODE_PATH;

function run( command, args, cwd = consumer ) {
	const result = spawnSync( command, args, {
		cwd,
		env,
		encoding: 'utf8',
		timeout: 300_000,
		maxBuffer: 20 * 1024 * 1024,
		shell: command === 'npm' && process.platform === 'win32',
	} );
	assert.ifError( result.error );
	assert.equal(
		result.status,
		0,
		`${ command } ${ args.join( ' ' ) }\n${ result.stdout }\n${
			result.stderr
		}`
	);
	return result.stdout + result.stderr;
}
function write( name, content ) {
	writeFileSync( path.join( consumer, name ), content );
}
function pack( name ) {
	const source = path.join( root, 'packages', name );
	const staging = path.join( directory, name );
	cpSync( source, staging, {
		recursive: true,
		filter: ( file ) => ! file.split( path.sep ).includes( 'node_modules' ),
	} );
	const manifest = JSON.parse(
		readFileSync( path.join( staging, 'package.json' ) )
	);
	// Apply the same file: -> version conversion as publication. Dependencies
	// other than the changed packages below come from the public registry.
	for ( const section of [
		'dependencies',
		'devDependencies',
		'optionalDependencies',
	] ) {
		for ( const [ dependency, version ] of Object.entries(
			manifest[ section ] ?? {}
		) ) {
			if ( version.startsWith( 'file:' ) ) {
				manifest[ section ][ dependency ] = JSON.parse(
					readFileSync(
						path.resolve(
							source,
							version.slice( 5 ),
							'package.json'
						)
					)
				).version;
			}
		}
	}
	writeFileSync(
		path.join( staging, 'package.json' ),
		JSON.stringify( manifest )
	);
	const output = JSON.parse(
		run(
			'npm',
			[
				'pack',
				staging,
				'--json',
				'--ignore-scripts',
				'--pack-destination',
				directory,
			],
			directory
		)
	);
	return `file:${ path.join( directory, output[ 0 ].filename ) }`;
}
const scripts = values.scripts ?? pack( 'scripts' );
const eslintPlugin = values[ 'eslint-plugin' ] ?? pack( 'eslint-plugin' );
write(
	'package.json',
	JSON.stringify( {
		name: 'wp-vitest-consumer',
		private: true,
		type: 'module',
		devDependencies: {
			'@wordpress/scripts': scripts,
			'@wordpress/eslint-plugin': eslintPlugin,
			'@wordpress/build': '0.23.0',
			'@wordpress/style-runtime': '0.11.0',
			'@wordpress/theme': '2.1.0',
			'@vitejs/plugin-react-swc': '4.3.3',
			'@testing-library/react': '16.3.3',
			'@testing-library/dom': '10.4.1',
			'@testing-library/jest-dom': '7.0.1',
			'vitest-browser-react': '2.3.0',
			eslint: '10.0.0',
			eslint9: 'npm:eslint@9.39.4',
			vitest: '^5',
			vite: values.vite,
			jsdom: '26.1.0',
			playwright: '1.63.0',
			react: '18.3.1',
			'react-dom': '18.3.1',
		},
		overrides: { '@wordpress/eslint-plugin': '$@wordpress/eslint-plugin' },
	} )
);
if ( values.lockfile ) {
	cpSync(
		path.resolve( values.lockfile ),
		path.join( consumer, 'package-lock.json' )
	);
}
console.log( `Consumer: ${ consumer }` );
run( 'npm', [ 'install', '--engine-strict', '--no-audit', '--no-fund' ] );
// Follow the guide's Node -> Browser installation order to catch version drift
// between the runner and its provider, including matching patch-version peers.
run( 'npm', [
	'install',
	'--save-dev',
	'--engine-strict',
	'--no-audit',
	'--no-fund',
	'@vitest/browser-playwright@^5',
] );
// A replayed lockfile can install despite an incompatible peer range.
run( 'npm', [ 'ls', 'vite', 'vitest', '@vitest/browser-playwright', '--all' ] );
assert.match(
	readFileSync(
		path.join(
			consumer,
			'node_modules/@wordpress/scripts/docs/vitest-migration.md'
		),
		'utf8'
	),
	/Release boundary/
);
const wpScripts = path.join(
	consumer,
	'node_modules/@wordpress/scripts/bin/wp-scripts.js'
);
const command = ( ...args ) =>
	run( values.node, [ wpScripts, 'test-unit-js', ...args ] );
const fixtureRoot = path.join(
	root,
	'tools/validation/fixtures/vitest-consumer'
);
for ( const name of [ 'node.test.mjs', 'dom.test.jsx', 'browser.test.jsx' ] ) {
	write( name, readFileSync( path.join( fixtureRoot, `${ name }.txt` ) ) );
}
// Move environment-specific tests out of native discovery until opted in.
renameSync(
	path.join( consumer, 'dom.test.jsx' ),
	path.join( consumer, 'dom.fixture.jsx' )
);
renameSync(
	path.join( consumer, 'browser.test.jsx' ),
	path.join( consumer, 'browser.fixture.jsx' )
);
console.log(
	run( values.node, [
		'-e',
		`console.log(JSON.stringify({node:process.version,vite:require('vite/package.json').version,vitest:require('vitest/package.json').version,build:require('@wordpress/build/package.json').version}))`,
	] )
);
assert.match( command(), /1 passed/ );
assert.match( command( '--help' ), /vitest/ );
assert.match(
	command( '--inspect=127.0.0.1:0', '--no-file-parallelism' ),
	/1 passed/
);
function stop( child ) {
	if ( process.platform === 'win32' ) {
		child.kill();
	} else {
		process.kill( -child.pid, 'SIGTERM' );
	}
}

// Verify the inspector actually pauses the worker, then resume it through CDP.
async function observe( args, pattern, onMatch ) {
	const child = spawn( values.node, [ wpScripts, 'test-unit-js', ...args ], {
		cwd: consumer,
		env,
		stdio: [ 'pipe', 'pipe', 'pipe' ],
		detached: process.platform !== 'win32',
	} );
	let output = '';
	let handled = false;
	const completed = new Promise( ( resolve, reject ) => {
		const timeout = setTimeout( () => {
			stop( child );
			reject( new Error( `Timed out: ${ output }` ) );
		}, 30_000 );
		const read = async ( data ) => {
			output += data.toString();
			if ( ! handled && pattern.test( output ) ) {
				handled = true;
				try {
					await onMatch( child, output );
				} catch ( error ) {
					stop( child );
					reject( error );
				}
			}
		};
		child.stdout.on( 'data', read );
		child.stderr.on( 'data', read );
		child.on( 'error', reject );
		child.on( 'close', ( code, signal ) => {
			clearTimeout( timeout );
			if ( ! handled || ( code !== 0 && signal !== 'SIGTERM' ) ) {
				reject( new Error( output ) );
			} else {
				resolve( output );
			}
		} );
	} );
	return completed;
}
await observe( [ '--watch' ], /Waiting for file changes/, async ( child ) => {
	await new Promise( ( resolve ) => {
		let rerunOutput = '';
		child.stdout.on( 'data', ( data ) => {
			rerunOutput += data.toString();
			if ( /RERUN[\s\S]*1 passed/.test( rerunOutput ) ) {
				resolve();
			}
		} );
		write(
			'node.test.mjs',
			readFileSync( path.join( consumer, 'node.test.mjs' ), 'utf8' ) +
				'\n// Trigger a watch rerun.\n'
		);
	} );
	stop( child );
} );
await observe(
	[ '--inspect-brk=127.0.0.1:0', '--no-file-parallelism' ],
	/ws:\/\/127\.0\.0\.1:\d+\/[^\s]+/,
	async ( child, output ) => {
		assert.doesNotMatch( output, /1 passed/ );
		const socket = new WebSocket(
			output.match( /ws:\/\/127\.0\.0\.1:\d+\/[^\s]+/ )[ 0 ]
		);
		await new Promise( ( resolve, reject ) => {
			socket.addEventListener( 'open', resolve, { once: true } );
			socket.addEventListener( 'error', reject, { once: true } );
		} );
		socket.send(
			JSON.stringify( {
				id: 1,
				method: 'Runtime.runIfWaitingForDebugger',
			} )
		);
		await new Promise( ( resolve ) =>
			socket.addEventListener( 'message', resolve, { once: true } )
		);
		socket.close();
	}
).then( ( output ) => assert.match( output, /1 passed/ ) );
write(
	'snapshot.test.mjs',
	"import { expect, test } from 'vitest';\ntest( 'updates snapshots', () => expect( 'new' ).toMatchSnapshot() );\n"
);
assert.match( command( '--update' ), /written/ );
const snapshot = path.join( consumer, '__snapshots__/snapshot.test.mjs.snap' );
writeFileSync(
	snapshot,
	readFileSync( snapshot, 'utf8' ).replace( '"new"', '"old"' )
);
assert.match( command( '--update' ), /updated/ );
rmSync( path.join( consumer, 'snapshot.test.mjs' ) );
rmSync( snapshot );
const config = ( marker ) =>
	`import { defineConfig } from 'vitest/config';\nexport default defineConfig({ define: { CONFIG_MARKER: ${ JSON.stringify(
		JSON.stringify( marker )
	) } }, test: { environment: 'node', globals: false } });\n`;
write(
	'node.test.mjs',
	"import { expect, test } from 'vitest'; test( 'loads the selected config', () => expect( CONFIG_MARKER ).toBe( process.env.EXPECTED_CONFIG ) );"
);
write( 'vite.config.mjs', config( 'vite' ) );
env.EXPECTED_CONFIG = 'vite';
command();
write( 'vitest.config.ts', config( 'vitest' ) );
env.EXPECTED_CONFIG = 'vitest';
command();
write( 'custom.config.mjs', config( 'explicit' ) );
env.EXPECTED_CONFIG = 'explicit';
command( '--config', 'custom.config.mjs' );
for ( const name of [
	'node.test.mjs',
	'vite.config.mjs',
	'vitest.config.ts',
	'custom.config.mjs',
] ) {
	rmSync( path.join( consumer, name ) );
}
for ( const name of [
	'vitest.jsdom.config.mjs',
	'vitest.browser.config.mjs',
	'setup.mjs',
] ) {
	write( name, readFileSync( path.join( fixtureRoot, name ) ) );
}
// Build a real consumer package with the published CLI, then import its output.
mkdirSync( path.join( consumer, 'packages/fixture/src' ), { recursive: true } );
write(
	'packages/fixture/package.json',
	JSON.stringify( {
		name: '@consumer/fixture',
		version: '1.0.0',
		type: 'module',
		module: 'build-module/index.js',
	} )
);
write(
	'packages/fixture/src/index.js',
	"import styles from './style.module.css'; import './style.css'; export { styles };"
);
write(
	'packages/fixture/src/style.module.css',
	'.fixture { color: rgb(1, 2, 3); padding: var(--wpds-dimension-gap-sm); }'
);
write(
	'packages/fixture/src/style.css',
	'.ordinary-fixture { background-color: rgb(4, 5, 6); }'
);
run( values.node, [
	path.join( consumer, 'node_modules/@wordpress/build/lib/build.mjs' ),
] );
cpSync(
	path.join( consumer, 'packages/fixture/build-module/index.mjs' ),
	path.join( consumer, 'packages/fixture/build-module/duplicate.mjs' )
);
write(
	'generated.test.mjs',
	"import { expect, test } from 'vitest'; import { styles } from './packages/fixture/build-module/index.mjs'; test( 'loads generated CSS in Node', () => { expect(styles.fixture).toBeTruthy(); expect(typeof document).toBe('undefined'); });"
);
command();
rmSync( path.join( consumer, 'generated.test.mjs' ) );
command( '--config', 'vitest.jsdom.config.mjs' );
if ( values.browser ) {
	run( values.node, [
		path.join( consumer, 'node_modules/playwright/cli.js' ),
		'install',
		'chromium',
	] );
	command( '--config', 'vitest.browser.config.mjs' );
}
// Legacy consumers own the runner and preset dependencies. Install them only
// after the Vitest checks, so those checks cannot rely on bundled Jest.
run( 'npm', [
	'install',
	'--save-dev',
	'--save-exact',
	'--engine-strict',
	'--no-audit',
	'--no-fund',
	'jest@30.5.0',
	'jest-environment-jsdom@30.5.0',
	'@wordpress/jest-preset-default@14.2.0',
	'babel-jest@30.5.0',
	'@babel/core@7.29.0',
	'@wordpress/babel-preset-default@8.55.0',
] );
write(
	'legacy.test.cjs',
	"test( 'retains Jest', () => expect( 2 + 2 ).toBe( 4 ) );"
);
write(
	'jest.config.cjs',
	"module.exports = { testMatch: ['**/legacy.test.cjs'], testEnvironment: 'node' };"
);
assert.match(
	run( values.node, [
		wpScripts,
		'test-unit-jest',
		'--config',
		'jest.config.cjs',
		'--runInBand',
	] ),
	/1 passed/
);
rmSync( path.join( consumer, 'legacy.test.cjs' ) );
rmSync( path.join( consumer, 'jest.config.cjs' ) );
write(
	'legacy.test.js',
	"test('retains the WordPress Jest preset', () => { expect(document.createElement('div')).toBeDefined(); expect(console).not.toHaveWarned(); });"
);
write(
	'jest.config.cjs',
	`module.exports = { preset: '@wordpress/jest-preset-default', transform: { '\\\\.[jt]sx?$': [ 'babel-jest', { presets: [ '@wordpress/babel-preset-default' ] } ] } };`
);
assert.match(
	run( values.node, [ wpScripts, 'test-unit-jest', '--runInBand' ] ),
	/1 passed/
);
rmSync( path.join( consumer, 'legacy.test.js' ) );
rmSync( path.join( consumer, 'jest.config.cjs' ) );
// Inspect the actual fallback lint config, including TS and spec discovery.
for ( const name of [ 'example.test.js', 'example.spec.ts' ] ) {
	write(
		name,
		"import { test, expect } from 'vitest'; test.only( 'fails lint', () => expect( true ).toBe( true ) );"
	);
	const output = JSON.parse(
		run( values.node, [
			path.join( consumer, 'node_modules/eslint/bin/eslint.js' ),
			'--config',
			path.join(
				consumer,
				'node_modules/@wordpress/scripts/config/eslint.config.cjs'
			),
			'--print-config',
			name,
		] )
	);
	assert.ok( output.rules[ 'vitest/no-focused-tests' ] );
	assert.equal( output.rules[ 'jest/no-focused-tests' ], undefined );
	assert.equal( output.languageOptions.globals?.test, undefined );
	const result = spawnSync(
		values.node,
		[ wpScripts, 'lint-js', '--format=json', name ],
		{ cwd: consumer, env, encoding: 'utf8', timeout: 30_000 }
	);
	assert.equal( result.status, 1, result.stderr );
	assert.ok(
		JSON.parse( result.stdout )[ 0 ].messages.some(
			( message ) => message.ruleId === 'vitest/no-focused-tests'
		)
	);
}
// The deprecated eslintrc entry still works on ESLint 9 during its transition.
write(
	'lint-legacy.cjs',
	`const { LegacyESLint } = require('eslint9/use-at-your-own-risk');
const config = require('@wordpress/eslint-plugin/eslintrc').configs['test-unit'];
new LegacyESLint({ useEslintrc: false, overrideConfig: config }).lintText("import { test, expect } from 'vitest'; test.only('focused', () => expect(true).toBe(true));").then(results => console.log(JSON.stringify(results[0].messages)));`
);
const legacyMessages = run( values.node, [ 'lint-legacy.cjs' ] ).split(
	'\n'
)[ 0 ];
assert.ok(
	JSON.parse( legacyMessages ).some(
		( message ) => message.ruleId === '@vitest/no-focused-tests'
	)
);
console.log(
	'Passed consumer commands, config discovery, jsdom, generated CSS, Jest compatibility, and lint defaults.'
);
console.log(
	values.browser ? 'Passed Browser Mode.' : 'Browser Mode not requested.'
);
