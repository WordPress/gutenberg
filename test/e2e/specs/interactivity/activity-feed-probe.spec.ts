/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'activity feed probe', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
	} );

	test( 'photos page renders the feed region', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const url = await utils.addPostWithBlock( 'test/activity-feed', {
			alias: 'probe - photos',
			attributes: {
				filter: 'photos',
				posts: [
					{
						id: 11,
						title: 'Photo post',
						text: 'a nice photo',
						comments: { 111: 'nice shot!' },
					},
				],
				tabs: {},
			},
		} );
		process.stdout.write( 'URL: ' + url + '\n' );

		const resp = await page.request.get( url );
		process.stdout.write( 'status: ' + resp.status() + '\n' );
		const body = await resp.text();
		const hasRegion = body.includes( 'data-wp-router-region="activity-feed"' );
		const hasCard = body.includes( 'data-testid="post-11"' );
		process.stdout.write( 'hasRegion: ' + hasRegion + '\n' );
		process.stdout.write( 'hasCard: ' + hasCard + '\n' );
		if ( ! hasRegion || ! hasCard ) {
			process.stdout.write( 'BODY SNIPPET: ' + body.slice( 0, 1500 ) + '\n' );
		}

		await page.goto( url );
		await expect( page.getByTestId( 'post-11' ) ).toBeVisible();
	} );
} );
