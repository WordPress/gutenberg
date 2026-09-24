import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import {
	classifyTypeScriptDiagnostics,
	getCssEntrypoints,
	inspectPackagePublications,
	packPackage,
} from '../packages/check-esm-package-types-helpers.mjs';
import { checkNodeNextTypes } from '../packages/check-esm-package-types.mjs';

let fixtureDirectory;
let packageDirectory;
let packDestination;

afterEach( async () => {
	if ( fixtureDirectory ) {
		await rm( fixtureDirectory, { recursive: true, force: true } );
		fixtureDirectory = undefined;
	}
} );

async function createPackageFixture( files ) {
	fixtureDirectory = await mkdtemp(
		path.join( tmpdir(), 'gutenberg-esm-package-types-' )
	);
	packageDirectory = path.join( fixtureDirectory, 'package' );
	packDestination = path.join( fixtureDirectory, 'archives' );
	await mkdir( packageDirectory );
	await mkdir( packDestination );
	const packageJson = {
		name: 'esm-package-types-fixture',
		version: '1.0.0',
		type: 'module',
		files,
	};
	await writeFile(
		path.join( packageDirectory, 'package.json' ),
		JSON.stringify( packageJson )
	);
	await mkdir( path.join( packageDirectory, 'build-types' ) );
	await writeFile(
		path.join( packageDirectory, 'build-types', 'index.d.ts' ),
		'export {};'
	);
	await writeFile(
		path.join( packageDirectory, 'tsconfig.build.json' ),
		JSON.stringify( {
			compilerOptions: { types: [] },
			include: [ 'build-types' ],
		} )
	);
	return packageJson;
}

test( 'packs declarations included through a package files glob', async () => {
	const packageJson = await createPackageFixture( [ '*' ] );
	const packedPackage = packPackage(
		{ directory: packageDirectory, packageJson },
		packDestination
	);

	expect( packedPackage.declarations ).toEqual( [
		path.join( packageDirectory, 'build-types', 'index.d.ts' ),
	] );
	await expect(
		access( packedPackage.tarballPath )
	).resolves.toBeUndefined();
} );

test( 'omits declarations excluded from the packed package', async () => {
	const packageJson = await createPackageFixture( [ 'dist' ] );

	expect(
		packPackage(
			{ directory: packageDirectory, packageJson },
			packDestination
		).declarations
	).toEqual( [] );
} );

test( 'continues package packing after a failure', () => {
	const packages = [
		{ packageJson: { name: 'first' } },
		{ packageJson: { name: 'second' } },
	];
	const failure = new Error( 'Inspection failed' );
	const inspectPackage = vi
		.fn()
		.mockImplementationOnce( () => {
			throw failure;
		} )
		.mockReturnValueOnce( {
			declarations: [ '/packages/second/build-types/index.d.ts' ],
			files: [ '/packages/second/build-types/index.d.ts' ],
			tarballPath: '/archives/second.tgz',
		} );

	expect(
		inspectPackagePublications( packages, '/archives', inspectPackage )
	).toEqual( [
		{ status: 'rejected', packageData: packages[ 0 ], reason: failure },
		{
			status: 'fulfilled',
			packageData: packages[ 1 ],
			packedPackage: {
				declarations: [ '/packages/second/build-types/index.d.ts' ],
				files: [ '/packages/second/build-types/index.d.ts' ],
				tarballPath: '/archives/second.tgz',
			},
		},
	] );
	expect( inspectPackage ).toHaveBeenCalledTimes( 2 );
	expect( inspectPackage ).toHaveBeenLastCalledWith(
		packages[ 1 ],
		'/archives'
	);
} );

test( 'keeps diagnostics from the generated tsconfig', () => {
	const diagnostic =
		'packages/theme/.gutenberg-esm-types-123/tsconfig.json(3,4): error TS6046: Invalid option.';

	expect(
		classifyTypeScriptDiagnostics(
			[ diagnostic ],
			[
				'packages/theme/build-types/',
				'packages/theme/.gutenberg-esm-types-123/tsconfig.json',
			]
		)
	).toEqual( {
		hasTypeScriptDiagnostics: true,
		relevantDiagnostics: [ diagnostic ],
	} );
} );

test( 'ignores diagnostics from external dependencies', () => {
	const diagnostic =
		'node_modules/dependency/index.d.ts(1,1): error TS2307: Missing type.';

	expect(
		classifyTypeScriptDiagnostics(
			[ diagnostic ],
			[
				'packages/theme/build-types/',
				'packages/theme/.gutenberg-esm-types-123/tsconfig.json',
			]
		)
	).toEqual( {
		hasTypeScriptDiagnostics: true,
		relevantDiagnostics: [],
	} );
} );

test( 'returns only nested CSS-only exports as ATTW exclusions', () => {
	const packageJson = {
		exports: {
			'./design-tokens.css': {
				browser: './build-style.css',
				default: {
					import: './build-style.css',
					types: null,
				},
			},
			'./plugin': {
				import: './build-module.js',
				style: './build-style.css',
			},
			'./package.json': './package.json',
		},
	};

	expect( getCssEntrypoints( packageJson ) ).toEqual( [
		'design-tokens.css',
	] );
} );

test( 'fails when a published declaration imports an omitted sibling declaration', async () => {
	const packageJson = await createPackageFixture( [
		'build-types/extra.d.ts',
	] );
	await writeFile(
		path.join( packageDirectory, 'build-types', 'extra.d.ts' ),
		"export type { Hidden } from './hidden.ts';"
	);
	await writeFile(
		path.join( packageDirectory, 'build-types', 'hidden.d.ts' ),
		'export interface Hidden {}'
	);
	const packedPackage = packPackage(
		{ directory: packageDirectory, packageJson },
		packDestination
	);

	await expect(
		checkNodeNextTypes(
			{ directory: packageDirectory, packageJson },
			packedPackage
		)
	).rejects.toThrow( "Cannot find module './hidden.ts'" );
} );
