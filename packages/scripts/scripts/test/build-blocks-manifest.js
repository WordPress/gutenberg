/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { execSync } = require( 'child_process' );
const rimraf = require( 'rimraf' ).sync;

const fixturesPath = path.join(
	__dirname,
	'fixtures',
	'build-blocks-manifest'
);
const outputPath = path.join( __dirname, 'build', 'test-blocks-manifest' );

describe( 'build-blocks-manifest script', () => {
	beforeAll( () => {
		if ( ! fs.existsSync( outputPath ) ) {
			fs.mkdirSync( outputPath, { recursive: true } );
		}
		rimraf( outputPath );
	} );

	afterAll( () => {
		rimraf( outputPath );
	} );

	it( 'should generate expected blocks manifest', () => {
		const inputDir = path.join( fixturesPath, 'input' );
		const outputFile = path.join( outputPath, 'blocks-manifest.php' );

		// Run the build-blocks-manifest script
		const scriptPath = path.resolve(
			__dirname,
			'..',
			'build-blocks-manifest.js'
		);
		execSync(
			`node ${ scriptPath } --input=${ inputDir } --output=${ outputFile }`
		);

		const generatedContent = fs.readFileSync( outputFile, 'utf8' );
		expect( generatedContent ).toMatchSnapshot();
	} );

	it( 'should error on empty input directory', () => {
		const emptyInputDir = path.join( fixturesPath, 'empty-input' );
		const outputFile = path.join( outputPath, 'empty-blocks-manifest.php' );

		const scriptPath = path.resolve(
			__dirname,
			'..',
			'build-blocks-manifest.js'
		);
		let error;
		try {
			execSync(
				`node ${ scriptPath } --input=${ emptyInputDir } --output=${ outputFile }`,
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
			__dirname,
			'..',
			'build-blocks-manifest.js'
		);
		let error;
		try {
			execSync(
				`node ${ scriptPath } --input=${ nonExistentInputDir } --output=${ outputFile }`,
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
