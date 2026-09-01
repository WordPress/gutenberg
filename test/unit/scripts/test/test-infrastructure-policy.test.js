import { spawnSync } from 'node:child_process';
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { resolvePackageBin } from '../resolve-package-bin.mjs';
import { resolveTypeRoots } from '../resolve-type-roots.mjs';
import {
	findVitestIsolationOptOuts,
	validateRoutingScripts,
} from '../test-infrastructure-policy.mjs';

const temporaryDirectories = [];

function createTemporaryDirectory() {
	const directory = mkdtempSync(
		path.join( tmpdir(), 'gutenberg-test-infrastructure-' )
	);
	temporaryDirectories.push( directory );
	return directory;
}

function writeJson( filename, value ) {
	mkdirSync( path.dirname( filename ), { recursive: true } );
	writeFileSync( filename, `${ JSON.stringify( value, null, 2 ) }\n` );
}

function writeModulePackage( directory, packageJson, files ) {
	writeJson( path.join( directory, 'package.json' ), {
		type: 'module',
		...packageJson,
	} );
	for ( const [ filename, source ] of Object.entries( files ) ) {
		writeFileSync( path.join( directory, filename ), source );
	}
}

afterEach( () => {
	for ( const directory of temporaryDirectories.splice( 0 ) ) {
		rmSync( directory, { force: true, recursive: true } );
	}
} );

describe( 'test infrastructure policy', () => {
	it( 'requires exact root and workspace routing scripts', () => {
		expect(
			validateRoutingScripts(
				{
					scripts: { 'test:unit:routing': 'echo --' },
				},
				{
					scripts: {
						'test:unit:routing':
							'node scripts/validate-test-routing.mjs',
					},
				}
			)
		).toEqual( [
			'package.json: scripts.test:unit:routing must be exactly `npm run --workspace @wordpress/unit-tests test:unit:routing --`',
		] );
		expect(
			validateRoutingScripts(
				{
					scripts: {
						'test:unit:routing':
							'npm run --workspace @wordpress/unit-tests test:unit:routing --',
					},
				},
				{
					scripts: { 'test:unit:routing': 'echo' },
				}
			)
		).toEqual( [
			'test/unit/package.json: scripts.test:unit:routing must be exactly `node scripts/validate-test-routing.mjs`',
		] );
		expect(
			validateRoutingScripts(
				{
					scripts: {
						'test:unit:routing':
							'npm run --workspace @wordpress/unit-tests test:unit:routing --',
					},
				},
				{
					scripts: {
						'test:unit:routing':
							'node scripts/validate-test-routing.mjs',
					},
				}
			)
		).toEqual( [] );
	} );
} );

describe( 'runner isolation policy', () => {
	it( 'reports command surfaces that disable module isolation', () => {
		const rootDir = createTemporaryDirectory();
		writeJson( path.join( rootDir, 'package.json' ), {
			scripts: { test: 'vitest --no-isolate' },
		} );
		mkdirSync( path.join( rootDir, '.github/workflows' ), {
			recursive: true,
		} );
		mkdirSync( path.join( rootDir, '.github/actions/run-tests' ), {
			recursive: true,
		} );
		writeFileSync(
			path.join( rootDir, '.github/workflows/test.yml' ),
			'run: "vitest --no-isolate"\n'
		);
		writeFileSync(
			path.join( rootDir, '.github/actions/run-tests/action.yml' ),
			"run: 'vitest --isolate false'\n"
		);

		expect( findVitestIsolationOptOuts( rootDir ) ).toEqual( [
			".github/actions/run-tests/action.yml:1 disables Vitest module isolation: run: 'vitest --isolate false'",
			'.github/workflows/test.yml:1 disables Vitest module isolation: run: "vitest --no-isolate"',
			'package.json:scripts.test disables Vitest module isolation: vitest --no-isolate',
		] );
	} );
} );

describe( 'non-hoisted Vitest infrastructure', () => {
	it( 'resolves type roots from the workspace that owns them', () => {
		const rootDir = createTemporaryDirectory();
		const workspaceDir = path.join( rootDir, 'test/unit' );
		const typeRoot = path.join( workspaceDir, 'node_modules/@types' );
		writeJson( path.join( workspaceDir, 'package.json' ), {} );
		writeJson( path.join( typeRoot, 'fixture/package.json' ), {
			name: '@types/fixture',
			version: '1.0.0',
		} );
		const workspaceRequire = createRequire(
			path.join( workspaceDir, 'package.json' )
		);

		expect(
			resolveTypeRoots( [ 'fixture', 'missing' ], ( specifier ) =>
				workspaceRequire.resolve( specifier )
			)
		).toEqual( [ realpathSync( typeRoot ) ] );
	} );

	it( 'loads the real setup without the jest-dom Vitest entry point', () => {
		const rootDir = createTemporaryDirectory();
		const workspaceDir = path.join( rootDir, 'test/unit' );
		const storeDir = path.join( rootDir, 'store' );
		const configDir = path.join( workspaceDir, 'config' );
		const sourceConfigDir = path.resolve(
			import.meta.dirname,
			'../../config'
		);
		mkdirSync( path.join( configDir, 'matchers' ), { recursive: true } );
		for ( const filename of [
			'testing-library.vitest.js',
			'matchers/to-match-diff-snapshot.vitest.js',
			'matchers/to-be-positioned-popover.vitest.js',
		] ) {
			copyFileSync(
				path.join( sourceConfigDir, filename ),
				path.join( configDir, filename )
			);
			if ( filename.includes( '/matchers/' ) ) {
				copyFileSync(
					path.join( sourceConfigDir, filename ),
					path.join( configDir, filename.slice( 0, -3 ) )
				);
			}
		}

		const vitestStore = path.join( storeDir, 'vitest' );
		writeModulePackage(
			vitestStore,
			{ name: 'vitest', exports: './index.js' },
			{
				'index.js': `
export const expect = Object.assign( () => ( {} ), { extend() {}, addSnapshotSerializer() {} } );
export const Snapshots = { toMatchSnapshot() {} };
export const vi = {};
export const afterAll = () => {};
export const afterEach = () => {};
export const beforeAll = () => {};
`,
			}
		);
		const jestDomStore = path.join( storeDir, 'jest-dom' );
		writeModulePackage(
			jestDomStore,
			{
				name: '@testing-library/jest-dom',
				exports: {
					'./matchers': './matchers.js',
					'./vitest': './vitest.js',
				},
			},
			{
				'matchers.js': 'export function toBeInTheDocument() {}\n',
				'vitest.js':
					"import { expect } from 'vitest';\nexpect.extend( {} );\n",
			}
		);
		const reactStore = path.join( storeDir, 'testing-library-react' );
		writeModulePackage(
			reactStore,
			{ name: '@testing-library/react', exports: './index.js' },
			{ 'index.js': 'export function cleanup() {}\n' }
		);

		const nodeModules = path.join( workspaceDir, 'node_modules' );
		mkdirSync( path.join( nodeModules, '@testing-library' ), {
			recursive: true,
		} );
		symlinkSync( vitestStore, path.join( nodeModules, 'vitest' ), 'dir' );
		symlinkSync(
			jestDomStore,
			path.join( nodeModules, '@testing-library/jest-dom' ),
			'dir'
		);
		symlinkSync(
			reactStore,
			path.join( nodeModules, '@testing-library/react' ),
			'dir'
		);
		writeJson( path.join( workspaceDir, 'package.json' ), {
			type: 'module',
		} );
		writeFileSync(
			path.join( workspaceDir, 'load-setup.mjs' ),
			"import './config/testing-library.vitest.js';\n"
		);
		writeFileSync(
			path.join( workspaceDir, 'load-jest-dom-vitest.mjs' ),
			"import '@testing-library/jest-dom/vitest';\n"
		);
		const loaderPath = path.join( workspaceDir, 'extension-loader.mjs' );
		writeFileSync(
			loaderPath,
			`export async function resolve( specifier, context, nextResolve ) {
	try {
		return await nextResolve( specifier, context );
	} catch ( error ) {
		if ( specifier.startsWith( '.' ) && specifier.endsWith( '.vitest' ) ) {
			return nextResolve( \`${ '${specifier}' }.js\`, context );
		}
		throw error;
	}
}
`
		);

		const legacyResult = spawnSync(
			process.execPath,
			[ path.join( workspaceDir, 'load-jest-dom-vitest.mjs' ) ],
			{ encoding: 'utf8' }
		);
		const setupResult = spawnSync(
			process.execPath,
			[
				'--no-warnings',
				`--experimental-loader=${ pathToFileURL( loaderPath ).href }`,
				path.join( workspaceDir, 'load-setup.mjs' ),
			],
			{ encoding: 'utf8' }
		);

		expect( legacyResult.status ).not.toBe( 0 );
		expect( `${ legacyResult.stdout }${ legacyResult.stderr }` ).toContain(
			"Cannot find package 'vitest'"
		);
		expect( `${ setupResult.stdout }${ setupResult.stderr }` ).toBe( '' );
		expect( setupResult.status ).toBe( 0 );
	} );

	it( 'type-checks Gutenberg matcher augmentation with workspace-local Vitest', () => {
		const rootDir = createTemporaryDirectory();
		const workspaceDir = path.join( rootDir, 'test/unit' );
		const vitestDir = path.join( workspaceDir, 'node_modules/vitest' );
		const jestDomDir = path.join(
			workspaceDir,
			'node_modules/@testing-library/jest-dom'
		);
		const typingsDir = path.join(
			workspaceDir,
			'typings/gutenberg-vitest-test-env'
		);
		mkdirSync( vitestDir, { recursive: true } );
		mkdirSync( jestDomDir, { recursive: true } );
		mkdirSync( typingsDir, { recursive: true } );
		writeJson( path.join( workspaceDir, 'package.json' ), {
			type: 'module',
		} );
		writeJson( path.join( vitestDir, 'package.json' ), {
			name: 'vitest',
			version: '4.0.0',
			types: 'index.d.ts',
		} );
		writeFileSync(
			path.join( vitestDir, 'index.d.ts' ),
			'export interface Matchers<T = any> { toBe(value: unknown): void; }\nexport declare const vi: unknown;\nexport declare function expect<T>(value: T): Matchers<T>;\n'
		);
		writeJson( path.join( jestDomDir, 'package.json' ), {
			name: '@testing-library/jest-dom',
			version: '1.0.0',
			exports: {
				'./matchers': {
					types: './matchers.d.ts',
				},
			},
		} );
		writeFileSync(
			path.join( jestDomDir, 'matchers.d.ts' ),
			'export interface TestingLibraryMatchers<E, R> { toBeVisible(): R; }\n'
		);
		copyFileSync(
			path.resolve(
				import.meta.dirname,
				'../../typings/gutenberg-vitest-test-env/index.d.ts'
			),
			path.join( typingsDir, 'index.d.ts' )
		);
		writeFileSync(
			path.join( workspaceDir, 'matcher.test.ts' ),
			"import { expect } from 'vitest';\nexpect( {} ).toHaveWarned();\nexpect( document.body ).toBeVisible();\n"
		);
		writeJson( path.join( workspaceDir, 'tsconfig.json' ), {
			compilerOptions: {
				lib: [ 'ES2022', 'DOM' ],
				module: 'NodeNext',
				moduleResolution: 'NodeNext',
				noEmit: true,
				strict: true,
				typeRoots: [ path.join( workspaceDir, 'typings' ) ],
				types: [ 'gutenberg-vitest-test-env' ],
			},
			files: [ path.join( workspaceDir, 'matcher.test.ts' ) ],
		} );

		const result = spawnSync(
			process.execPath,
			[
				resolvePackageBin( 'typescript', 'tsc6' ),
				'--project',
				path.join( workspaceDir, 'tsconfig.json' ),
				'--pretty',
				'false',
			],
			{ encoding: 'utf8' }
		);

		expect( `${ result.stdout }${ result.stderr }` ).toBe( '' );
		expect( result.status ).toBe( 0 );
	} );
} );
