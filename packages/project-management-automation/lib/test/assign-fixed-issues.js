/**
 * Internal dependencies
 */
import assignFixedIssues from '../assign-fixed-issues';

describe( 'assignFixedIssues', () => {
	it( 'does nothing if there are no fixed issues', async () => {
		const payload = {
			pull_request: {
				body: 'This pull request seeks to make Gutenberg better than ever.',
			},
		};
		const octokit = {
			issues: {
				addAssignees: jest.fn(),
				addLabels: jest.fn(),
			},
		};

		await assignFixedIssues( payload, octokit );

		expect( octokit.issues.addAssignees ).not.toHaveBeenCalled();
		expect( octokit.issues.addLabels ).not.toHaveBeenCalled();
	} );

	it( 'assigns and labels fixed issues', async () => {
		const payload = {
			pull_request: {
				body: 'This pull request seeks to close #123 and also fixes https://github.com/WordPress/gutenberg/issues/456.',
				user: {
					login: 'matt',
				},
			},
			repository: {
				owner: {
					login: 'WordPress',
				},
				name: 'gutenberg',
			},
		};
		const octokit = {
			issues: {
				addAssignees: jest.fn( () => Promise.resolve( {} ) ),
				addLabels: jest.fn( () => Promise.resolve( {} ) ),
			},
		};

		await assignFixedIssues( payload, octokit );

		expect( octokit.issues.addAssignees ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			assignees: [ 'matt' ],
		} );
		expect( octokit.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			labels: [ '[Status] In Progress' ],
		} );
		expect( octokit.issues.addAssignees ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 456,
			assignees: [ 'matt' ],
		} );
		expect( octokit.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 456,
			labels: [ '[Status] In Progress' ],
		} );
	} );
} );
