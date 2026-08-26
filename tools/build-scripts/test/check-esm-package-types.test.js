import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { publishesBuildTypes } from '../packages/check-esm-package-types-helpers.mjs';

let fixtureDirectory;

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
	const packageJson = {
		name: 'esm-package-types-fixture',
		version: '1.0.0',
		files,
	};
	await writeFile(
		path.join( fixtureDirectory, 'package.json' ),
		JSON.stringify( packageJson )
	);
	await mkdir( path.join( fixtureDirectory, 'build-types' ) );
	await writeFile(
		path.join( fixtureDirectory, 'build-types', 'index.d.ts' ),
		'export {};'
	);
	return packageJson;
}

test( 'detects build-types included through a package files glob', async () => {
	const packageJson = await createPackageFixture( [ '*' ] );

	expect(
		publishesBuildTypes( { directory: fixtureDirectory, packageJson } )
	).toBe( true );
} );

test( 'skips a package whose packed files omit build-types', async () => {
	const packageJson = await createPackageFixture( [ 'dist' ] );

	expect(
		publishesBuildTypes( { directory: fixtureDirectory, packageJson } )
	).toBe( false );
} );
