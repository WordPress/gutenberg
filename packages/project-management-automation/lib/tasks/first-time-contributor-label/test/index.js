import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const actionsCorePath = require.resolve( '@actions/core' );
const originalActionsCore = require( actionsCorePath );
const setOutput = vi.fn();
const taskPath = require.resolve( '../' );
let firstTimeContributorLabel;
try {
	require.cache[ actionsCorePath ].exports = {
		...originalActionsCore,
		setOutput,
	};
	firstTimeContributorLabel = require( taskPath );
} finally {
	require.cache[ actionsCorePath ].exports = originalActionsCore;
	delete require.cache[ taskPath ];
}

describe( 'firstTimeContributorLabel', () => {
	beforeEach( () => {
		setOutput.mockReset();
	} );

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

	it( 'does nothing for PRs by bots', async () => {
		const payloadForBot = {
			...payload,
			pull_request: {
				user: {
					login: 'ghost',
					type: 'Bot',
				},
				number: 123,
			},
		};

		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn(),
				},
				search: {
					commits: vi.fn(),
				},
			},
		};

		await firstTimeContributorLabel( payloadForBot, octokit );

		expect( octokit.rest.repos.listCommits ).not.toHaveBeenCalled();
		expect( octokit.rest.search.commits ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the commits list finds a previous commit', async () => {
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
				search: {
					commits: vi.fn(),
				},
				issues: {
					addLabels: vi.fn(),
				},
			},
		};

		await firstTimeContributorLabel( payload, octokit );

		expect( octokit.rest.repos.listCommits ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			author: 'ghost',
		} );
		expect( octokit.rest.search.commits ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.addLabels ).not.toHaveBeenCalled();
		expect( setOutput ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if the search fallback finds a previous commit', async () => {
		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn( () => Promise.resolve( { data: [] } ) ),
				},
				search: {
					commits: vi.fn( () =>
						Promise.resolve( {
							data: {
								total_count: 1,
								items: [
									{
										sha: '4c535288a6a2b75ff23ee96c75f7d9877e919241',
									},
								],
							},
						} )
					),
				},
				issues: {
					addLabels: vi.fn(),
				},
			},
		};

		await firstTimeContributorLabel( payload, octokit );

		expect( octokit.rest.search.commits ).toHaveBeenCalledWith( {
			q: 'repo:WordPress/gutenberg author:ghost',
			per_page: 1,
		} );
		expect( octokit.rest.issues.addLabels ).not.toHaveBeenCalled();
		expect( setOutput ).not.toHaveBeenCalled();
	} );

	it( 'adds the First Time Contributor label if neither finds a commit', async () => {
		const octokit = {
			rest: {
				repos: {
					listCommits: vi.fn( () => Promise.resolve( { data: [] } ) ),
				},
				search: {
					commits: vi.fn( () =>
						Promise.resolve( {
							data: {
								total_count: 0,
								items: [],
							},
						} )
					),
				},
				issues: {
					addLabels: vi.fn(),
				},
			},
		};

		const expectedComment =
			':wave: Thanks for your first Pull Request and for helping build the future of Gutenberg and WordPress, @ghost' +
			"! In case you missed it, we'd love to have you join us in our [Slack community](https://make.wordpress.org/chat/).\n\n" +
			'If you want to learn more about WordPress development in general, check out the [Core Handbook](https://make.wordpress.org/core/handbook/) full of helpful information.';

		await firstTimeContributorLabel( payload, octokit );

		expect( octokit.rest.issues.addLabels ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			labels: [ 'First-time Contributor' ],
		} );
		expect( setOutput ).toHaveBeenCalledWith(
			'welcome-prompt',
			expectedComment
		);
	} );
} );
