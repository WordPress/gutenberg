/**
 * @format
 * */

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import ParagraphBlockInteraction from './blocks/paragraph-block-interaction';
import { setupAppium, setupDriver, isLocalEnvironment, timer } from './helpers/utils';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

describe( 'Gutenberg Editor tests', () => {
	let appium;
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
		if ( isLocalEnvironment() ) {
			appium = await setupAppium();
		}

		driver = await setupDriver();
	} );

	it( 'should be able to see visual editor', async () => {
		editorPage = new EditorPage( driver );
		await editorPage.expect();
	} );

	it( 'should be able to add a new Paragraph block', async () => {
		let paragraphBlockInteraction = new ParagraphBlockInteraction( driver );
		paragraphBlockInteraction = await editorPage.addNewBlock( paragraphBlockInteraction );
		await paragraphBlockInteraction.sendText( 'Hello Gutenberg!' );
		await timer( 3000 );
		expect( await paragraphBlockInteraction.getText() ).toBe( 'Hello Gutenberg!' );
	} );

	afterAll( async () => {
		if ( isLocalEnvironment() ) {
			if ( driver === undefined ) {
				if ( appium !== undefined ) {
					await appium.kill( 'SIGINT' );
				}
				return;
			}

			await driver.quit();
			await appium.kill( 'SIGINT' );
		} else {
			if ( driver === undefined ) {
				if ( appium !== undefined ) {
					await appium.kill( 'SIGINT' );
				}
				return;
			}
			driver.sauceJobStatus( allPassed );
			await driver.quit();
		}
	} );
} );
