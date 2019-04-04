/**
 * @format
 * */

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import { setupAppium, setupDriver, isLocalEnvironment, timer } from './helpers/utils';
import testData from './helpers/test-data';

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
		await editorPage.addNewParagraphBlock();
		const paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.shortText );
		await editorPage.removeBlockAtPosition( 0 );
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.addNewParagraphBlock();
		const paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.longText );
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
