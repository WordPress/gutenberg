/**
 * @format
 * */

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	setupDriver,
	isLocalEnvironment,
	stopDriver,
	isAndroid,
} from './helpers/utils';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

describe( 'Gutenberg Editor Latest Post Block tests', () => {
	let driver;
	let editorPage;
	let allPassed = true;

	// Use reporter for setting status for saucelabs Job
	if ( ! isLocalEnvironment() ) {
		const reporter = {
			specDone: async ( result ) => {
				allPassed = allPassed && result.status !== 'failed';
			},
		};

		jasmine.getEnv().addReporter( reporter );
	}

	beforeAll( async () => {
		driver = await setupDriver();
		editorPage = new EditorPage( driver );
	} );

	it( 'should be able to see visual editor', async () => {
		await expect( editorPage.getBlockList() ).resolves.toBe( true );
	} );

	if ( isAndroid() ) { //limit this test to Android to temporarily avoid the problem here https://app.circleci.com/pipelines/github/wordpress-mobile/gutenberg-mobile/5887/workflows/5664a5c7-2efc-4ca6-be22-eab8c1b79677/jobs/31498
		it( 'should be able to add a Latests-Posts block', async () => {
			await editorPage.addNewLatestPostsBlock();
			const latestPostsBlock = await editorPage.getLatestPostsBlockAtPosition( 1 );

			expect( latestPostsBlock ).toBeTruthy();
			await editorPage.removeLatestPostsBlockAtPosition( 1 );
		} );
	}

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
