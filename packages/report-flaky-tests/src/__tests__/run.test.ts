import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as core from '@actions/core';
import { run } from '../run';

const { mockMkdir, mockReadFile, mockReaddir, mockWriteFile } = vi.hoisted(
	() => ( {
		mockMkdir: vi.fn(),
		mockReadFile:
			vi.fn< ( path: string, encoding: string ) => Promise< string > >(),
		mockReaddir: vi.fn< ( path: string ) => Promise< string[] > >(),
		mockWriteFile: vi.fn(),
	} )
);

vi.mock( import( '@actions/core' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	error: vi.fn(),
	info: vi.fn(),
	getInput: vi.fn(),
} ) );

vi.mock( import( 'fs/promises' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		mkdir: mockMkdir as unknown as typeof original.mkdir,
		readFile: mockReadFile as unknown as typeof original.readFile,
		readdir: mockReaddir as unknown as typeof original.readdir,
		writeFile: mockWriteFile as unknown as typeof original.writeFile,
	};
} );

const mockedGetInput = vi.mocked( core.getInput );

function mockInputs() {
	mockedGetInput
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

	mockReaddir.mockImplementationOnce( () =>
		Promise.resolve( [
			`${ playwrightFlakyTest.title }.json`,
			`${ jestFlakyTest.title }.json`,
		] )
	);
	mockReadFile
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( playwrightFlakyTest ) )
		)
		.mockImplementationOnce( () =>
			Promise.resolve( JSON.stringify( jestFlakyTest ) )
		);
}

describe( 'Report flaky tests', () => {
	beforeEach( () => {
		vi.resetAllMocks();
	} );

	it( 'should write the report', async () => {
		await mockFlakyTestsArtifact();

		await run();

		expect( mockWriteFile ).toHaveBeenCalledTimes( 1 );
		expect( mockWriteFile.mock.calls[ 0 ][ 0 ] ).toBe( 'pr-meta/body.md' );
		expect( mockWriteFile.mock.calls[ 0 ][ 1 ] ).toMatchSnapshot();
	} );

	it( 'should write nothing when there are no flaky tests', async () => {
		mockInputs();
		mockReaddir.mockImplementationOnce( () => Promise.resolve( [] ) );

		await run();

		expect( mockWriteFile ).not.toHaveBeenCalled();
	} );

	/*
	 * A clean run produces no artifact at all. The writer treats the missing
	 * file as an empty section, which is what clears a stale report.
	 */
	it( 'should write nothing when the artifact is missing', async () => {
		mockInputs();

		const missing = Object.assign( new Error( 'ENOENT' ), {
			code: 'ENOENT',
		} );
		mockReaddir.mockImplementationOnce( () => Promise.reject( missing ) );

		await run();

		expect( mockWriteFile ).not.toHaveBeenCalled();
	} );

	/* Anything else would clear a report that nothing had disproved. */
	it( 'should fail rather than report clean when the artifact is unreadable', async () => {
		mockInputs();

		const denied = Object.assign( new Error( 'EACCES' ), {
			code: 'EACCES',
		} );
		mockReaddir.mockImplementationOnce( () => Promise.reject( denied ) );

		await expect( run() ).rejects.toThrow( 'EACCES' );
		expect( mockWriteFile ).not.toHaveBeenCalled();
	} );
} );
