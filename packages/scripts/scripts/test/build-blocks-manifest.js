import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rimrafSync } from 'rimraf';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const currentDirectory = path.dirname( fileURLToPath( import.meta.url ) );
const fixturesPath = path.join(
	currentDirectory,
	'fixtures',
	'build-blocks-manifest'
);
const outputPath = path.join(
	currentDirectory,
	'build',
	'test-blocks-manifest'
);

describe( 'build-blocks-manifest script', () => {
	beforeAll( () => {
		rimrafSync( outputPath );
	} );

	afterAll( () => {
		rimrafSync( outputPath );
	} );

	it( 'should generate expected blocks manifest', () => {
		const inputDir = path.join( fixturesPath, 'input' );
		const outputFile = path.join( outputPath, 'blocks-manifest.php' );

		// Run the build-blocks-manifest script
		const scriptPath = path.resolve(
			currentDirectory,
			'..',
			'build-blocks-manifest.js'
		);
		execFileSync( process.execPath, [
			scriptPath,
			`--input=${ inputDir }`,
			`--output=${ outputFile }`,
		] );

		const generatedContent = fs.readFileSync( outputFile, 'utf8' );
		expect( generatedContent ).toMatchSnapshot();
	} );

	it( 'should error on empty input directory', () => {
		const emptyInputDir = path.join( fixturesPath, 'empty-input' );
		const outputFile = path.join( outputPath, 'empty-blocks-manifest.php' );

		const scriptPath = path.resolve(
			currentDirectory,
			'..',
			'build-blocks-manifest.js'
		);
		let error;
		try {
			execFileSync(
				process.execPath,
				[
					scriptPath,
					`--input=${ emptyInputDir }`,
					`--output=${ outputFile }`,
				],
				{ encoding: 'utf8' }
			);
		} catch ( e ) {
			error = e;
		}

		// Check that an error was thrown.
		expect( error ).toBeDefined();
		expect( error.stdout ).toContain(
			`No block.json files were found in path`
		);

		// Ensure that the output file was not created
		expect( fs.existsSync( outputFile ) ).toBe( false );
	} );

	it( 'should error on missing input directory', () => {
		const nonExistentInputDir = path.join( fixturesPath, 'missing-input' );
		const outputFile = path.join( outputPath, 'empty-blocks-manifest.php' );

		const scriptPath = path.resolve(
			currentDirectory,
			'..',
			'build-blocks-manifest.js'
		);
		let error;
		try {
			execFileSync(
				process.execPath,
				[
					scriptPath,
					`--input=${ nonExistentInputDir }`,
					`--output=${ outputFile }`,
				],
				{ encoding: 'utf8' }
			);
		} catch ( e ) {
			error = e;
		}

		// Check that an error was thrown.
		expect( error ).toBeDefined();
		expect( error.stdout ).toContain( `does not exist` );

		// Ensure that the output file was not created
		expect( fs.existsSync( outputFile ) ).toBe( false );
	} );
} );
