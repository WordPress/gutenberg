import { execFileSync } from 'child_process';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// Runs `npm run browse` the way an agent does, on the site under test.
function browse( ...args: string[] ) {
	return execFileSync(
		'npm',
		[ 'run', '--silent', 'browse', '--', ...args ],
		{
			encoding: 'utf8',
		}
	).trim();
}

test.describe( 'npm run browse', () => {
	test.afterAll( () => {
		browse( 'close' );
	} );

	test( 'opens a post, edits its blocks and calls the REST API', () => {
		browse( 'open' );
		browse(
			'new-post',
			JSON.stringify( {
				content: '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->',
			} )
		);
		browse(
			'insert',
			JSON.stringify( {
				name: 'core/heading',
				attributes: { content: 'Title', level: 3 },
			} )
		);

		expect( JSON.parse( browse( 'blocks' ) ) ).toEqual( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Hi', dropCap: false },
				innerBlocks: [],
			},
			{
				name: 'core/heading',
				attributes: { content: 'Title', level: 3 },
				innerBlocks: [],
			},
		] );
		expect(
			JSON.parse( browse( 'api', 'GET', '/wp/v2/types/post' ) ).slug
		).toBe( 'post' );
	} );
} );
