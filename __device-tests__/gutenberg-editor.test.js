/**
 * @format
 * */

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import { setupAppium, setupDriver, isLocalEnvironment, timer, clickMiddleOfElement } from './helpers/utils';
import testData from './helpers/test-data';

/**
 * External dependencies
 */
import wd from 'wd';

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

	it( 'should be able to split one paragraph block into two', async () => {
		await editorPage.addNewParagraphBlock();
		const paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.shortText );
		const textViewElement = await editorPage.getTextViewForParagraphBlock( paragraphBlockElement );
		await clickMiddleOfElement( driver, textViewElement );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, '\n' );
		await timer( 3000 );
		expect( await editorPage.hasParagraphBlockAtPosition( 0 ) && await editorPage.hasParagraphBlockAtPosition( 1 ) )
			.toBe( true );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 0 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text0 ).not.toBe( '' );
		expect( text1 ).not.toBe( '' );
		expect( testData.shortText ).toMatch( new RegExp( `${ text0 + text1 }|${ text0 } ${ text1 }` ) );

		await editorPage.removeBlockAtPosition( 1 );
		await editorPage.removeBlockAtPosition( 0 );
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.addNewParagraphBlock();
		const paragraphBlockElement = await editorPage.getParagraphBlockAtPosition( 0 );
		await editorPage.sendTextToParagraphBlock( paragraphBlockElement, testData.longText );

		for ( let i = 3; i > -1; i-- ) {
			await editorPage.removeBlockAtPosition( i );
		}
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
