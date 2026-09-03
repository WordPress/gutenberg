import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const actionsCorePath = require.resolve( '@actions/core' );
const originalActionsCore = require( actionsCorePath );
const setOutput = vi.fn();
const hasWordPressProfile = vi.fn();
const hasWordPressProfilePath = require.resolve(
	'../../../has-wordpress-profile'
);
const originalHasWordPressProfile = require( hasWordPressProfilePath );
const taskPath = require.resolve( '../' );
let firstTimeContributorAccountLink;
try {
	require.cache[ actionsCorePath ].exports = {
		...originalActionsCore,
		setOutput,
	};
	require.cache[ hasWordPressProfilePath ].exports = hasWordPressProfile;
	firstTimeContributorAccountLink = require( taskPath );
} finally {
	require.cache[ actionsCorePath ].exports = originalActionsCore;
	require.cache[ hasWordPressProfilePath ].exports =
		originalHasWordPressProfile;
	delete require.cache[ taskPath ];
}
const botUser = {
	data: {
		name: 'Ghost',
		email: 'ghost@example.invalid',
		username: 'ghost',
		type: 'Bot',
	},
};
const humanUser = {
	data: {
		name: 'Ghost',
		email: 'ghost@example.invalid',
		username: 'ghost',
		type: 'User',
	},
};

describe( 'firstTimeContributorAccountLink', () => {
	beforeEach( () => {
		setOutput.mockReset();
		hasWordPressProfile.mockReset();
	} );

	const payload = {
		ref: 'refs/heads/trunk',
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

	it( 'does nothing if not a commit to trunk', async () => {
		const payloadForBranchPush = {
			...payload,
			ref: 'refs/heads/update/chicken-branch',
		};

		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn(),
				},
				users: {
					getByUsername: vi.fn( () => humanUser ),
				},
			},
		};

		await firstTimeContributorAccountLink( payloadForBranchPush, octokit );

		expect( octokit.rest.users.getByUsername ).not.toHaveBeenCalled();
		expect( octokit.rest.repos.listCommits ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if commit pull request undeterminable', async () => {
		const payloadDirectToTrunk = {
			...payload,
			commits: [
				{
					message: 'Add a feature direct to trunk',
					author: {
						name: 'Ghost',
						email: 'ghost@example.invalid',
						username: 'ghost',
					},
				},
			],
		};

		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn(),
				},
				users: {
					getByUsername: vi.fn( () => humanUser ),
				},
			},
		};

		await firstTimeContributorAccountLink( payloadDirectToTrunk, octokit );

		expect( octokit.rest.users.getByUsername ).not.toHaveBeenCalled();
		expect( octokit.rest.repos.listCommits ).not.toHaveBeenCalled();
	} );

	it( 'does nothing for commits by bots', async () => {
		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn(),
				},
				users: {
					// Return a bot when `getByUsername` is called.
					getByUsername: vi.fn( () => botUser ),
				},
			},
		};

		await firstTimeContributorAccountLink( payload, octokit );

		expect( octokit.rest.users.getByUsername ).toHaveBeenCalledWith( {
			username: payload.commits[ 0 ].author.username,
		} );
		expect( octokit.rest.repos.listCommits ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the user has multiple commits', async () => {
		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn( () =>
						Promise.resolve( {
							data: [
								{
									sha: '4c535288a6a2b75ff23ee96c75f7d9877e919241',
								},
								{
									sha: '59b07cc57adff90630fc9d5cf2317269a0f4f158',
								},
							],
						} )
					),
				},
				users: {
					getByUsername: vi.fn( () => humanUser ),
				},
			},
		};

		await firstTimeContributorAccountLink( payload, octokit );

		expect( octokit.rest.users.getByUsername ).toHaveBeenCalledWith( {
			username: payload.commits[ 0 ].author.username,
		} );
		expect( octokit.rest.repos.listCommits ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			author: 'ghost',
		} );
		expect( setOutput ).not.toHaveBeenCalled();
	} );

	it( 'aborts if the request to retrieve WordPress.org user profile fails', async () => {
		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn( () =>
						Promise.resolve( {
							data: [
								{
									sha: '4c535288a6a2b75ff23ee96c75f7d9877e919241',
								},
							],
						} )
					),
				},
				users: {
					getByUsername: vi.fn( () => humanUser ),
				},
			},
		};

		hasWordPressProfile.mockImplementation( () => {
			return Promise.reject( new Error( 'Whoops!' ) );
		} );

		await firstTimeContributorAccountLink( payload, octokit );

		expect( octokit.rest.users.getByUsername ).toHaveBeenCalledWith( {
			username: payload.commits[ 0 ].author.username,
		} );
		expect( octokit.rest.repos.listCommits ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			author: 'ghost',
		} );
		expect( setOutput ).not.toHaveBeenCalled();
	} );

	it( 'prompts the user to link their GitHub account to their WordPress.org profile', async () => {
		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn( () =>
						Promise.resolve( {
							data: [
								{
									sha: '4c535288a6a2b75ff23ee96c75f7d9877e919241',
								},
							],
						} )
					),
				},
				users: {
					getByUsername: vi.fn( () => humanUser ),
				},
			},
		};

		hasWordPressProfile.mockReturnValue( Promise.resolve( false ) );

		await firstTimeContributorAccountLink( payload, octokit );

		expect( octokit.rest.users.getByUsername ).toHaveBeenCalledWith( {
			username: payload.commits[ 0 ].author.username,
		} );
		expect( octokit.rest.repos.listCommits ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			author: 'ghost',
		} );
		expect( setOutput ).toHaveBeenCalledWith(
			'first-time-contributor-prompt',
			expect.stringMatching( /^Congratulations/ )
		);
		expect( setOutput ).toHaveBeenCalledWith(
			'first-time-contributor-pr-number',
			123
		);
	} );
} );
