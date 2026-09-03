import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const assignFixedIssues = require( '../' );

describe( 'assignFixedIssues', () => {
	it( 'does nothing if there are no fixed issues', async () => {
		const payload = {
			pull_request: {
				body: 'This pull request seeks to make Gutenberg better than ever.',
			},
		};
		const octokit = {
			rest: {
				issues: {
					addAssignees: vi.fn(),
					addLabels: vi.fn(),
				},
			},
		};

		await assignFixedIssues( payload, octokit );

		expect( octokit.rest.issues.addAssignees ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.addLabels ).not.toHaveBeenCalled();
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
			rest: {
				issues: {
					addAssignees: vi.fn( () => Promise.resolve( {} ) ),
					addLabels: vi.fn( () => Promise.resolve( {} ) ),
				},
			},
		};

		await assignFixedIssues( payload, octokit );

		expect( octokit.rest.issues.addAssignees ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			assignees: [ 'matt' ],
		} );
		expect( octokit.rest.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			labels: [ '[Status] In Progress' ],
		} );
		expect( octokit.rest.issues.addAssignees ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 456,
			assignees: [ 'matt' ],
		} );
		expect( octokit.rest.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 456,
			labels: [ '[Status] In Progress' ],
		} );
	} );
} );
