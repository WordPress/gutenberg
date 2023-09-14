/**
 * Internal dependencies
 */
import prPreviewLink, { COMMENT_PLACEHOLDER } from '../';

describe( 'prPreviewLink', () => {
	it( 'does nothing if event is not workflow_run', async () => {
		const payload = {
			workflow_run: null,
			repository: {
				name: 'gutenberg',
				owner: 'WordPress',
			},
		};
		const octokit = {
			rest: {
				actions: {
					listWorkflowRunArtifacts: jest.fn(),
				},
				issues: {
					listComments: jest.fn(),
					updateComment: jest.fn(),
					createComment: jest.fn(),
				},
				markdown: {
					render: jest.fn(),
				},
			},
		};

		await prPreviewLink( payload, octokit );

		expect( octokit.rest.markdown.render ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.listComments ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.updateComment ).not.toHaveBeenCalled();
		expect( octokit.rest.issues.createComment ).not.toHaveBeenCalled();
		expect(
			octokit.rest.actions.listWorkflowRunArtifacts
		).not.toHaveBeenCalled();
	} );

	it( 'does nothing if action is neither in_progress nor completed', async () => {
		const payload = {
			action: 'requested',
			repository: {
				name: 'gutenberg',
				owner: {
					login: 'WordPress',
				},
				html_url: 'https://github.com/WordPress/gutenberg',
			},
			workflow_run: {
				event: 'workflow_run',
				id: 123,
				pull_requests: [
					{
						number: 456,
					},
				],
				head_sha: 'abcdef12345',
			},
		};

		// Mock Octokit methods
		const octokit = {
			rest: {
				markdown: {
					render: jest.fn(),
				},
			},
		};

		// Call prPreviewLink with the mock payload and octokit
		await prPreviewLink( payload, octokit );

		// Expect the markdown.render method not to be called
		expect( octokit.rest.markdown.render ).not.toHaveBeenCalled();
	} );

	it( 'renders the correct Markdown content for an in-progress build', async () => {
		const payload = {
			action: 'in_progress',
			repository: {
				name: 'gutenberg',
				owner: {
					login: 'WordPress',
				},
				html_url: 'https://github.com/WordPress/gutenberg',
			},
			workflow_run: {
				event: 'workflow_run',
				id: 123,
				pull_requests: [
					{
						number: 456,
					},
				],
				head_sha: 'abcdef12345',
			},
		};

		// Mock Octokit methods
		const octokit = {
			rest: {
				markdown: {
					render: jest.fn( () =>
						Promise.resolve( { data: 'Mocked Markdown Output' } )
					),
				},
				issues: {
					listComments: jest.fn( () =>
						Promise.resolve( { data: [] } )
					),
					updateComment: jest.fn(),
					createComment: jest.fn(),
				},
			},
		};

		// Call prPreviewLink with the mock payload and octokit
		await prPreviewLink( payload, octokit );

		expect( octokit.rest.markdown.render ).toHaveBeenCalledWith( {
			mode: 'gfm',
			text: expect.stringContaining( 'Building in progress...' ),
		} );
		expect( octokit.rest.issues.listComments ).toHaveBeenCalledWith( {
			issue_number: 456,
			owner: 'WordPress',
			repo: 'gutenberg',
		} );
		expect( octokit.rest.issues.createComment ).toHaveBeenCalledWith( {
			issue_number: 456,
			owner: 'WordPress',
			repo: 'gutenberg',
			body: `<!--${ COMMENT_PLACEHOLDER }-->Mocked Markdown Output`,
		} );
		expect( octokit.rest.issues.updateComment ).not.toHaveBeenCalled();
	} );

	it( 'adds a comment on successful build', async () => {
		const payload = {
			action: 'completed',
			repository: {
				name: 'gutenberg',
				owner: {
					login: 'WordPress',
				},
				html_url: 'https://github.com/WordPress/gutenberg',
			},
			workflow_run: {
				event: 'workflow_run',
				id: 123,
				pull_requests: [
					{
						number: 456,
					},
				],
				check_suite_id: 789,
				head_sha: 'abcdef12345',
			},
		};

		// Mock Octokit methods
		const octokit = {
			rest: {
				actions: {
					listWorkflowRunArtifacts: jest.fn( () => {
						return Promise.resolve( {
							data: {
								artifacts: [
									{
										id: '987',
										size_in_bytes: 1024 * 1024, // 1 MB
									},
								],
							},
						} );
					} ),
				},
				issues: {
					listComments: jest.fn( () => {
						// Mock an existing comment from the same action
						return Promise.resolve( {
							data: [
								{
									id: 789,
									body: `<!--${ COMMENT_PLACEHOLDER }-->Mocked existing comment`,
								},
							],
						} );
					} ),
					updateComment: jest.fn(),
					createComment: jest.fn(),
				},
				markdown: {
					render: jest.fn( () => {
						return Promise.resolve( {
							data: 'Mocked rendered comment',
						} );
					} ),
				},
			},
		};

		// Call prPreviewLink with the mock payload and octokit
		await prPreviewLink( payload, octokit );

		expect( octokit.rest.markdown.render ).toHaveBeenCalledWith( {
			mode: 'gfm',
			text: expect.stringContaining( 'Build successful!' ),
		} );
		// Expect markdown render to contain the artifact URL
		expect( octokit.rest.markdown.render ).toHaveBeenCalledWith( {
			mode: 'gfm',
			text: expect.stringContaining(
				'[gutenberg-plugin](https://github.com/WordPress/gutenberg/suites/789/artifacts/987) - 1.00 MB'
			),
		} );
		// Expect the existing comment to be updated
		expect( octokit.rest.issues.updateComment ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			comment_id: 789, // Existing comment ID
			body: `<!--${ COMMENT_PLACEHOLDER }-->Mocked rendered comment`,
		} );
		expect( octokit.rest.issues.createComment ).not.toHaveBeenCalled();
		expect(
			octokit.rest.actions.listWorkflowRunArtifacts
		).toHaveBeenCalled();
	} );

	it( 'adds a comment on failed build', async () => {
		const payload = {
			action: 'completed',
			repository: {
				name: 'gutenberg',
				owner: {
					login: 'WordPress',
				},
				html_url: 'https://github.com/WordPress/gutenberg',
			},
			workflow_run: {
				event: 'workflow_run',
				id: 123,
				pull_requests: [
					{
						number: 456,
					},
				],
				head_sha: 'abcdef12345',
			},
		};

		// Mock Octokit methods
		const octokit = {
			rest: {
				actions: {
					listWorkflowRunArtifacts: jest.fn( () => {
						return Promise.resolve( {
							data: {
								artifacts: [], // Simulate no artifacts found for a failed build
							},
						} );
					} ),
				},
				issues: {
					listComments: jest.fn( () => {
						// Mock an existing comment from the same action
						return Promise.resolve( {
							data: [
								{
									id: 789,
									body: `<!--${ COMMENT_PLACEHOLDER }-->Mocked existing comment`,
								},
							],
						} );
					} ),
					updateComment: jest.fn(),
					createComment: jest.fn(),
				},
				markdown: {
					render: jest.fn( () => {
						return Promise.resolve( {
							data: 'Mocked failed build comment',
						} );
					} ),
				},
			},
		};

		// Call prPreviewLink with the mock payload and octokit
		await prPreviewLink( payload, octokit );

		expect( octokit.rest.markdown.render ).toHaveBeenCalledWith( {
			mode: 'gfm',
			text: expect.stringContaining( 'Build failed!' ),
		} );
		expect( octokit.rest.issues.updateComment ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			comment_id: 789, // Existing comment ID
			body: `<!--${ COMMENT_PLACEHOLDER }-->Mocked failed build comment`,
		} );
		expect( octokit.rest.issues.createComment ).not.toHaveBeenCalled();
		expect(
			octokit.rest.actions.listWorkflowRunArtifacts
		).toHaveBeenCalled();
	} );
} );
