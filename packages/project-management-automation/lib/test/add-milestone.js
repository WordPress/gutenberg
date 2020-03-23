/**
 * Internal dependencies
 */
import addMilestone from '../add-milestone';

describe( 'addMilestone', () => {
	it( 'does nothing if base is not master', async () => {
		const payload = {
			ref: 'refs/heads/not-master',
		};
		const octokit = {
			issues: {
				get: jest.fn(),
				createMilestone: jest.fn(),
				listMilestonesForRepo: jest.fn(),
				update: jest.fn(),
			},
			repos: {
				getContents: jest.fn(),
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.issues.get ).not.toHaveBeenCalled();
		expect( octokit.issues.createMilestone ).not.toHaveBeenCalled();
		expect( octokit.issues.listMilestonesForRepo ).not.toHaveBeenCalled();
		expect( octokit.issues.update ).not.toHaveBeenCalled();
		expect( octokit.repos.getContents ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if PR already has a milestone', async () => {
		const payload = {
			ref: 'refs/heads/master',
			commits: [ { message: '(#123)' } ],
			repository: {
				owner: {
					login: 'WordPress',
				},
				name: 'gutenberg',
			},
		};
		const octokit = {
			issues: {
				get: jest.fn( () =>
					Promise.resolve( {
						data: {
							milestone: 'Gutenberg 6.4',
						},
					} )
				),
				createMilestone: jest.fn(),
				listMilestonesForRepo: jest.fn(),
				update: jest.fn(),
			},
			repos: {
				getContents: jest.fn(),
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.issues.get ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: '123',
		} );
		expect( octokit.issues.createMilestone ).not.toHaveBeenCalled();
		expect( octokit.issues.listMilestonesForRepo ).not.toHaveBeenCalled();
		expect( octokit.issues.update ).not.toHaveBeenCalled();
		expect( octokit.repos.getContents ).not.toHaveBeenCalled();
	} );

	it( 'correctly milestones PRs when `package.json` has a `*.[1-8]` version', async () => {
		const payload = {
			ref: 'refs/heads/master',
			commits: [ { message: '(#123)' } ],
			repository: {
				owner: {
					login: 'WordPress',
				},
				name: 'gutenberg',
			},
		};
		const octokit = {
			issues: {
				get: jest.fn( () =>
					Promise.resolve( {
						data: {
							milestone: null,
						},
					} )
				),
				createMilestone: jest.fn(),
				listMilestonesForRepo: jest.fn( () =>
					Promise.resolve( {
						data: [
							{ title: 'Gutenberg 6.2', number: 10 },
							{ title: 'Gutenberg 6.3', number: 11 },
							{ title: 'Gutenberg 6.4', number: 12 },
						],
					} )
				),
				update: jest.fn(),
			},
			repos: {
				getContents: jest.fn( () =>
					Promise.resolve( {
						data: {
							content: Buffer.from(
								JSON.stringify( {
									version: '6.3.0',
								} )
							).toString( 'base64' ),
							encoding: 'base64',
						},
					} )
				),
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.issues.get ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: '123',
		} );
		expect( octokit.repos.getContents ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			path: 'package.json',
		} );
		expect( octokit.issues.createMilestone ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			title: 'Gutenberg 6.4',
			due_on: '2019-08-26T00:00:00.000Z',
		} );
		expect( octokit.issues.listMilestonesForRepo ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
		} );
		expect( octokit.issues.update ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: '123',
			milestone: 12,
		} );
	} );

	it( 'correctly milestones PRs when `package.json` has a `*.9` version', async () => {
		const payload = {
			ref: 'refs/heads/master',
			commits: [ { message: '(#123)' } ],
			repository: {
				owner: {
					login: 'WordPress',
				},
				name: 'gutenberg',
			},
		};
		const octokit = {
			issues: {
				get: jest.fn( () =>
					Promise.resolve( {
						data: {
							milestone: null,
						},
					} )
				),
				createMilestone: jest.fn(),
				listMilestonesForRepo: jest.fn( () =>
					Promise.resolve( {
						data: [
							{ title: 'Gutenberg 6.8', number: 10 },
							{ title: 'Gutenberg 6.9', number: 11 },
							{ title: 'Gutenberg 7.0', number: 12 },
						],
					} )
				),
				update: jest.fn(),
			},
			repos: {
				getContents: jest.fn( () =>
					Promise.resolve( {
						data: {
							content: Buffer.from(
								JSON.stringify( {
									version: '6.9.0',
								} )
							).toString( 'base64' ),
							encoding: 'base64',
						},
					} )
				),
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.issues.get ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: '123',
		} );
		expect( octokit.repos.getContents ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			path: 'package.json',
		} );
		expect( octokit.issues.createMilestone ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			title: 'Gutenberg 7.0',
			due_on: '2019-11-18T00:00:00.000Z',
		} );
		expect( octokit.issues.listMilestonesForRepo ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
		} );
		expect( octokit.issues.update ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: '123',
			milestone: 12,
		} );
	} );
} );
