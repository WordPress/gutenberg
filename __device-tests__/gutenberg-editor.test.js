/**
 * @format
 * */

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import ParagraphBlockInteraction from './blocks/paragraph-block-interaction';
import { setupDriver, isLocalEnvironment, timer, stopDriver } from './helpers/utils';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

describe( 'Gutenberg Editor tests', () => {
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

	it( 'should be able to add a new Paragraph block', async () => {
		const paragraphBlockInteraction = new ParagraphBlockInteraction( driver );
		await editorPage.addNewBlock( paragraphBlockInteraction );
		await paragraphBlockInteraction.sendText( 'Hello Gutenberg!' );
		await timer( 3000 );
		expect( await paragraphBlockInteraction.getText() ).toBe( 'Hello Gutenberg!' );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
