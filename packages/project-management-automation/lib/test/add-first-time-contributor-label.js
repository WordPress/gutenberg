/**
 * Internal dependencies
 */
import addFirstTimeContributorLabel from '../add-first-time-contributor-label';

describe( 'addFirstTimeContributorLabel', () => {
	const payload = {
		pull_request: {
			user: {
				login: 'matt',
			},
			number: 123,
		},
		repository: {
			owner: {
				login: 'WordPress',
			},
			name: 'gutenberg',
		},
	};

	it( 'does nothing if the user has commits', async () => {
		const octokit = {
			search: {
				commits: jest.fn( () =>
					Promise.resolve( {
						data: {
							total_count: 100,
						},
					} )
				),
			},
			issues: {
				addLabels: jest.fn(),
			},
		};

		await addFirstTimeContributorLabel( payload, octokit );

		expect( octokit.search.commits ).toHaveBeenCalledWith( {
			q: 'repo:WordPress/gutenberg+author:matt',
		} );
		expect( octokit.issues.addLabels ).not.toHaveBeenCalled();
	} );

	it( 'adds the label if the user does not have commits', async () => {
		const octokit = {
			search: {
				commits: jest.fn( () =>
					Promise.resolve( {
						data: {
							total_count: 0,
						},
					} )
				),
			},
			issues: {
				addLabels: jest.fn(),
			},
		};

		await addFirstTimeContributorLabel( payload, octokit );

		expect( octokit.search.commits ).toHaveBeenCalledWith( {
			q: 'repo:WordPress/gutenberg+author:matt',
		} );
		expect( octokit.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			labels: [ 'First-time Contributor' ],
		} );
	} );
} );
