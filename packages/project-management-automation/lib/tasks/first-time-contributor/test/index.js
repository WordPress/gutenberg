/**
 * Internal dependencies
 */
import firstTimeContributor from '../';
import hasWordPressProfile from '../../../has-wordpress-profile';

jest.mock( '../../../has-wordpress-profile', () => jest.fn() );

describe( 'firstTimeContributor', () => {
	beforeEach( () => {
		hasWordPressProfile.mockReset();
	} );

	const payload = {
		ref: 'refs/heads/master',
		commits: [
			{
				id: '4c535288a6a2b75ff23ee96c75f7d9877e919241',
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
			repos: {
				listCommits: jest.fn(),
			},
		};

		await firstTimeContributor( payloadForBranchPush, octokit );

		expect( octokit.repos.listCommits ).not.toHaveBeenCalled();
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
			repos: {
				listCommits: jest.fn(),
			},
		};

		await firstTimeContributor( payloadDirectToMaster, octokit );

		expect( octokit.repos.listCommits ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the user has multiple commits', async () => {
		const octokit = {
			repos: {
				listCommits: jest.fn( () =>
					Promise.resolve( {
						data: [
							{ sha: '4c535288a6a2b75ff23ee96c75f7d9877e919241' },
							{ sha: '59b07cc57adff90630fc9d5cf2317269a0f4f158' },
						],
					} )
				),
			},
			issues: {
				addLabels: jest.fn(),
			},
		};

		await firstTimeContributor( payload, octokit );

		expect( octokit.repos.listCommits ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			author: 'ghost',
		} );
		expect( octokit.issues.addLabels ).not.toHaveBeenCalled();
	} );

	it( 'adds the label if this was the first commit for the user', async () => {
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
				createComment: jest.fn(),
			},
		};

		hasWordPressProfile.mockReturnValue( Promise.resolve( true ) );

		await firstTimeContributor( payload, octokit );

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
		expect( octokit.issues.createComment ).not.toHaveBeenCalled();
	} );

	it( 'aborts if the request to retrieve WordPress.org user profile fails', async () => {
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
				createComment: jest.fn(),
			},
		};

		hasWordPressProfile.mockImplementation( () => {
			return Promise.reject( new Error( 'Whoops!' ) );
		} );

		await firstTimeContributor( payload, octokit );

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
		expect( octokit.issues.createComment ).not.toHaveBeenCalled();
	} );

	it( 'prompts the user to link their GitHub account to their WordPress.org profile', async () => {
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
				createComment: jest.fn(),
			},
		};

		hasWordPressProfile.mockReturnValue( Promise.resolve( false ) );

		await firstTimeContributor( payload, octokit );

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
		expect( octokit.issues.createComment ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			body: expect.stringMatching( /^Congratulations/ ),
		} );
	} );
} );
