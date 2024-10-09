/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { execSync } = require( 'child_process' );
const rimraf = require( 'rimraf' );

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
		rimraf.sync( outputPath );
	} );

	afterAll( () => {
		rimraf.sync( outputPath );
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

	it( 'should handle empty input directory', () => {
		const emptyInputDir = path.join( fixturesPath, 'empty-input' );
		const outputFile = path.join( outputPath, 'empty-blocks-manifest.php' );

		// Run the build-blocks-manifest script with empty input
		const scriptPath = path.resolve(
			__dirname,
			'..',
			'build-blocks-manifest.js'
		);
		const result = execSync(
			`node ${ scriptPath } --input=${ emptyInputDir } --output=${ outputFile }`,
			{ encoding: 'utf8' }
		);

		// Check if warning message is displayed
		expect( result ).toContain( 'WARNING' );
		expect( result ).toContain( 'No block.json files were found' );

		// Read the generated file, compare with expected output
		const generatedContent = fs.readFileSync( outputFile, 'utf8' );
		expect( generatedContent ).toMatchSnapshot();
	} );
} );
