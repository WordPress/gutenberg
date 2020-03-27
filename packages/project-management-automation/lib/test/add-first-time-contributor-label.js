/**
 * Internal dependencies
 */
import addFirstTimeContributorLabel from '../add-first-time-contributor-label';

describe( 'addFirstTimeContributorLabel', () => {
	const payload = {
		ref: 'refs/heads/master',
		commits: [
			{
				message: 'Add a feature from pull request (#123)',
				author: {
					name: 'Ghost',
					email: 'ghost@example.invalid',
					username: 'ghost',
				},
			},
		],
		repository: {
			owner: {
				login: 'WordPress',
			},
			name: 'gutenberg',
		},
	};

	it( 'does nothing if not a commit to master', async () => {
		const payloadForBranchPush = {
			...payload,
			ref: 'refs/heads/update/chicken-branch',
		};

		const octokit = {
			search: {
				commits: jest.fn(),
			},
		};

		await addFirstTimeContributorLabel( payloadForBranchPush, octokit );

		expect( octokit.search.commits ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if commit pull request undeterminable', async () => {
		const payloadDirectToMaster = {
			...payload,
			commits: [
				{
					message: 'Add a feature direct to master',
					author: {
						name: 'Ghost',
						email: 'ghost@example.invalid',
						username: 'ghost',
					},
				},
			],
		};

		const octokit = {
			search: {
				commits: jest.fn(),
			},
		};

		await addFirstTimeContributorLabel( payloadDirectToMaster, octokit );

		expect( octokit.search.commits ).not.toHaveBeenCalled();
	} );

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
			q: 'repo:WordPress/gutenberg+author:ghost',
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
			q: 'repo:WordPress/gutenberg+author:ghost',
		} );
		expect( octokit.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			labels: [ 'First-time Contributor' ],
		} );
	} );
} );
