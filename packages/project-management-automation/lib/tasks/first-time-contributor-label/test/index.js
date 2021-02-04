/**
 * Internal dependencies
 */
import firstTimeContributorLabel from '../';

describe( 'firstTimeContributorLabel', () => {
	const payload = {
		repository: {
			owner: {
				login: 'WordPress',
			},
			name: 'gutenberg',
		},
		pull_request: {
			user: {
				login: 'ghost',
			},
			number: 123,
		},
	};

	it( 'does nothing if the user has at least one commit', async () => {
		const octokit = {
			repos: {
				listCommits: jest.fn( () =>
					Promise.resolve( {
						data: [
							{ sha: '4c535288a6a2b75ff23ee96c75f7d9877e919241' },
						],
					} )
				),
			},
			issues: {
				addLabels: jest.fn(),
			},
		};

		await firstTimeContributorLabel( payload, octokit );

		expect( octokit.repos.listCommits ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			author: 'ghost',
		} );
		expect( octokit.issues.addLabels ).not.toHaveBeenCalled();
	} );

	it( 'adds the First Time Contributor label if the user has no commits', async () => {
		const octokit = {
			repos: {
				listCommits: jest.fn( () =>
					Promise.resolve( {
						data: [],
					} )
				),
			},
			issues: {
				addLabels: jest.fn(),
			},
		};

		await firstTimeContributorLabel( payload, octokit );

		expect( octokit.repos.listCommits ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			author: 'ghost',
		} );
		expect( octokit.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			labels: [ 'First-time Contributor' ],
		} );
	} );
} );
