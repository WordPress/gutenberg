/**
 * External dependencies
 */
import * as core from '@actions/core';

/**
 * Internal dependencies
 */
import { run } from '../run';

jest.useFakeTimers( 'modern' ).setSystemTime( new Date( '2020-05-10' ) );

jest.mock( '@actions/core', () => ( {
	error: jest.fn(),
	info: jest.fn(),
	getInput: jest.fn(),
} ) );

const mockAPI = {
	headBranch: 'headBranch',
	runURL: 'runURL',
	downloadReportFromArtifact: jest.fn(),
	fetchAllIssuesLabeledFlaky: jest.fn(),
	findMergeBaseCommit: jest.fn(),
	updateIssue: jest.fn(),
	createIssue: jest.fn(),
};
jest.mock( '../github-api', () => ( {
	GitHubAPI: jest.fn().mockImplementation( () => mockAPI ),
} ) );

describe( 'Report flaky tests', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should report flaky tests to issue', async () => {
		const existingFlakyTest = await import(
			'../__fixtures__/should copy only partial selection of text blocks.json'
		).then( ( json ) => json.default );
		const newFlakyTest = await import(
			'../__fixtures__/Should insert new template part on creation.json'
		).then( ( json ) => json.default );
		const flakyIssues = await import(
			'../__fixtures__/flaky-issues.json'
		).then( ( json ) => json.default );

		( core.getInput as jest.Mock )
			.mockReturnValueOnce( 'repo-token' )
			.mockReturnValueOnce( 'flaky-tests-report' )
			.mockReturnValueOnce( '[Type] Flaky Test' );

		// Replacing the cwd for the test for consistent snapshot results.
		existingFlakyTest.path = existingFlakyTest.path.replace(
			'/home/runner/work/gutenberg/gutenberg',
			process.cwd()
		);
		mockAPI.downloadReportFromArtifact.mockImplementationOnce( () => [
			existingFlakyTest,
			newFlakyTest,
		] );

		mockAPI.fetchAllIssuesLabeledFlaky.mockImplementationOnce(
			() => flakyIssues
		);

		mockAPI.updateIssue.mockImplementationOnce( () => ( {
			html_url: 'html_url',
		} ) );

		mockAPI.createIssue.mockImplementationOnce( () => ( {
			html_url: 'html_url',
		} ) );

		await run();

		const existingFlakyIssue = flakyIssues.find(
			( issue ) =>
				issue.title === `[Flaky Test] ${ existingFlakyTest.title }`
		);
		expect( mockAPI.updateIssue ).toHaveBeenCalledWith(
			expect.objectContaining( {
				issue_number: existingFlakyIssue.number,
				state: 'open',
			} )
		);
		expect( mockAPI.updateIssue.mock.calls[ 0 ][ 0 ].body ).toMatchSnapshot(
			'Updated existing flaky issue'
		);

		expect( mockAPI.createIssue ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: `[Flaky Test] ${ newFlakyTest.title }`,
			} )
		);
		expect( mockAPI.createIssue.mock.calls[ 0 ][ 0 ].body ).toMatchSnapshot(
			'Created new flaky issue'
		);
	} );

	it( 'should skip for outdated branches', async () => {
		const flakyTest = await import(
			'../__fixtures__/should copy only partial selection of text blocks.json'
		).then( ( json ) => json.default );
		const flakyIssues = await import(
			'../__fixtures__/flaky-issues.json'
		).then( ( json ) => json.default );

		( core.getInput as jest.Mock )
			.mockReturnValueOnce( 'repo-token' )
			.mockReturnValueOnce( 'flaky-tests-report' )
			.mockReturnValueOnce( '[Type] Flaky Test' );

		// Replacing the cwd for the test for consistent snapshot results.
		flakyTest.path = flakyTest.path.replace(
			'/home/runner/work/gutenberg/gutenberg',
			process.cwd()
		);
		mockAPI.downloadReportFromArtifact.mockImplementationOnce( () => [
			flakyTest,
		] );

		mockAPI.fetchAllIssuesLabeledFlaky.mockImplementationOnce(
			() => flakyIssues
		);

		const latestAncestorDate = new Date( '2022-05-10' );
		mockAPI.findMergeBaseCommit.mockImplementationOnce( () => ( {
			committer: {
				date: latestAncestorDate.toISOString(),
			},
		} ) );

		// The issue is closed after the latest ancestor date,
		// indicating that the code base at this point is outdated.
		const flakyIssue = flakyIssues.find(
			( issue ) => issue.title === `[Flaky Test] ${ flakyTest.title }`
		);
		flakyIssue.state = 'closed';
		flakyIssue.closed_at = new Date( '2022-05-15' ).toISOString();

		await run();

		expect( mockAPI.findMergeBaseCommit ).toHaveBeenCalledTimes( 1 );

		expect( mockAPI.updateIssue ).not.toHaveBeenCalled();
	} );
} );
