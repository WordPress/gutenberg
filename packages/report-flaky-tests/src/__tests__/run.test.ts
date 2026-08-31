import * as core from '@actions/core';
import { run } from '../run';

jest.mock( '@actions/core', () => ( {
	error: jest.fn(),
	info: jest.fn(),
	getInput: jest.fn(),
} ) );

jest.mock( 'fs/promises', () => ( {
	readdir: jest.fn(),
	readFile: jest.fn(),
	writeFile: jest.fn(),
	mkdir: jest.fn(),
} ) );

function mockInputs() {
	( core.getInput as jest.Mock )
		// artifact-path
		.mockReturnValueOnce( 'flaky-tests' )
		// output-path
		.mockReturnValueOnce( 'pr-meta/body.md' );
}

async function mockFlakyTestsArtifact() {
	const playwrightFlakyTest = await import(
		'../__fixtures__/should copy only partial selection of text blocks.json'
	).then( ( json ) => json.default );
	const jestFlakyTest = await import(
		'../__fixtures__/Should insert new template part on creation.json'
	).then( ( json ) => json.default );

	mockInputs();

	// Replacing the cwd for the test for consistent snapshot results.
	playwrightFlakyTest.path = playwrightFlakyTest.path.replace(
		'/home/runner/work/gutenberg/gutenberg',
		process.cwd()
	);

	const mockedFs = require( 'fs/promises' );
	mockedFs.readdir.mockImplementationOnce( () =>
		Promise.resolve( [
			`${ playwrightFlakyTest.title }.json`,
			`${ jestFlakyTest.title }.json`,
		] )
	);
	mockedFs.readFile
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( playwrightFlakyTest ) )
		)
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( jestFlakyTest ) )
		);
}

describe( 'Report flaky tests', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should write the report', async () => {
		await mockFlakyTestsArtifact();

		await run();

		const mockedFs = require( 'fs/promises' );
		expect( mockedFs.writeFile ).toHaveBeenCalledTimes( 1 );
		expect( mockedFs.writeFile.mock.calls[ 0 ][ 0 ] ).toBe(
			'pr-meta/body.md'
		);
		expect( mockedFs.writeFile.mock.calls[ 0 ][ 1 ] ).toMatchSnapshot();
	} );

	it( 'should write nothing when there are no flaky tests', async () => {
		mockInputs();

		const mockedFs = require( 'fs/promises' );
		mockedFs.readdir.mockImplementationOnce( () => Promise.resolve( [] ) );

		await run();

		expect( mockedFs.writeFile ).not.toHaveBeenCalled();
	} );

	/*
	 * A clean run produces no artifact at all. The writer treats the missing
	 * file as an empty section, which is what clears a stale report.
	 */
	it( 'should write nothing when the artifact is missing', async () => {
		mockInputs();

		const mockedFs = require( 'fs/promises' );
		mockedFs.readdir.mockImplementationOnce( () =>
			Promise.reject( new Error( 'ENOENT' ) )
		);

		await run();

		expect( mockedFs.writeFile ).not.toHaveBeenCalled();
	} );
} );
