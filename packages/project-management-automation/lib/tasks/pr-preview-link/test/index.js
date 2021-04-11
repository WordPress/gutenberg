/**
 * Internal dependencies
 */
import prPreviewLink from '../';

describe( 'prPreviewLink', () => {
	const payload = {
		repository: {
			owner: {
				login: 'WordPress',
			},
			name: 'gutenberg',
		},
		pull_request: {
			number: 123,
		},
	};

	it( 'adds the adds a comment with a link to the gutenberg.run preview site', async () => {
		const octokit = {
			issues: {
				createComment: jest.fn(),
			},
		};

		const expectedComment = `Preview site for this PR: http://gutenberg.run/123`;

		await prPreviewLink( payload, octokit );

		expect( octokit.issues.createComment ).toHaveBeenCalledWith( {
			owner: 'WordPress',
			repo: 'gutenberg',
			issue_number: 123,
			body: expectedComment,
		} );
	} );
} );
