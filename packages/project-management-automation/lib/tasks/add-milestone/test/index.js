/**
 * Internal dependencies
 */
import addMilestone from '../';

describe( 'addMilestone', () => {
	it( 'does nothing if base is not trunk', async () => {
		const payload = {
			ref: 'refs/heads/not-trunk',
		};
		const octokit = {
			paginate: {
				iterator: jest.fn(),
			},
			rest: {
				issues: {
					get: jest.fn(),
					createMilestone: jest.fn(),
					listMilestones: {
						endpoint: {
							merge: jest.fn(),
						},
					},
					update: jest.fn(),
				},
				repos: {
					getContent: jest.fn(),
				},
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.rest.issues.get ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.createMilestone ).not.toHaveBeenCalled();
		expect(
			octokit.rest.issues.listMilestones.endpoint.merge
		).not.toHaveBeenCalled();
		expect( octokit.rest.issues.update ).not.toHaveBeenCalled();
		expect( octokit.rest.repos.getContent ).not.toHaveBeenCalled();
	} );

	it( 'does nothing if PR already has a milestone', async () => {
		const payload = {
			ref: 'refs/heads/trunk',
			commits: [ { message: '(#123)' } ],
			repository: {
				owner: {
					login: 'WordPress',
				},
				name: 'gutenberg',
			},
		};
		const octokit = {
			paginate: {
				iterator: jest.fn(),
			},
			rest: {
				issues: {
					get: jest.fn( () =>
						Promise.resolve( {
							data: {
								milestone: 'Gutenberg 6.4',
							},
						} )
					),
					createMilestone: jest.fn(),
					listMilestones: jest.fn(),
					update: jest.fn(),
				},
				repos: {
					getContent: jest.fn(),
				},
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.rest.issues.get ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
		} );
		expect( octokit.rest.issues.createMilestone ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.listMilestones ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.update ).not.toHaveBeenCalled();
		expect( octokit.rest.repos.getContent ).not.toHaveBeenCalled();
	} );

	it( 'correctly milestones PRs when `package.json` has a `*.[1-8]` version', async () => {
		const payload = {
			ref: 'refs/heads/trunk',
			commits: [ { message: '(#123)' } ],
			repository: {
				owner: {
					login: 'WordPress',
				},
				name: 'gutenberg',
			},
		};
		const octokit = {
			paginate: {
				iterator: jest.fn().mockReturnValue( [
					Promise.resolve( {
						data: [
							{
								title: 'Gutenberg 6.2',
								number: 10,
								due_on: '2019-07-29T00:00:00.000Z',
							},
							{
								title: 'Gutenberg 6.3',
								number: 11,
								due_on: '2019-08-12T00:00:00.000Z',
							},
							{
								title: 'Gutenberg 6.4',
								number: 12,
								due_on: '2019-08-26T00:00:00.000Z',
							},
						],
					} ),
				] ),
			},
			rest: {
				issues: {
					get: jest.fn( () =>
						Promise.resolve( {
							data: {
								milestone: null,
							},
						} )
					),
					createMilestone: jest.fn(),
					listMilestones: {
						endpoint: {
							merge: jest.fn(),
						},
					},
					update: jest.fn(),
				},
				repos: {
					getContent: jest.fn( () =>
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
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.rest.issues.get ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
		} );
		expect( octokit.rest.repos.getContent ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			path: 'package.json',
		} );
		expect( octokit.rest.issues.createMilestone ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			title: 'Gutenberg 6.4',
			due_on: '2019-08-26T00:00:00.000Z',
		} );
		expect( octokit.rest.issues.update ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			milestone: 12,
		} );
	} );

	it( 'correctly milestones PRs when `package.json` has a `*.9` version', async () => {
		const payload = {
			ref: 'refs/heads/trunk',
			commits: [ { message: '(#123)' } ],
			repository: {
				owner: {
					login: 'WordPress',
				},
				name: 'gutenberg',
			},
		};
		const octokit = {
			paginate: {
				iterator: jest.fn().mockReturnValue( [
					Promise.resolve( {
						data: [
							{
								title: 'Gutenberg 6.8',
								number: 10,
								due_on: '2019-10-21T00:00:00.000Z',
							},
							{
								title: 'Gutenberg 6.9',
								number: 11,
								due_on: '2019-11-04T00:00:00.000Z',
							},
							{
								title: 'Gutenberg 7.0',
								number: 12,
								due_on: '2019-11-18T00:00:00.000Z',
							},
						],
					} ),
				] ),
			},
			rest: {
				issues: {
					get: jest.fn( () =>
						Promise.resolve( {
							data: {
								milestone: null,
							},
						} )
					),
					createMilestone: jest.fn(),
					listMilestones: {
						endpoint: {
							merge: jest.fn(),
						},
					},
					update: jest.fn(),
				},
				repos: {
					getContent: jest.fn( () =>
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
			},
		};

		await addMilestone( payload, octokit );

		expect( octokit.rest.issues.get ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
		} );
		expect( octokit.rest.repos.getContent ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			path: 'package.json',
		} );
		expect( octokit.rest.issues.createMilestone ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			title: 'Gutenberg 7.0',
			due_on: '2019-11-18T00:00:00.000Z',
		} );
		expect( octokit.rest.issues.update ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			milestone: 12,
		} );
	} );
} );
