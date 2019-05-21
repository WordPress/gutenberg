/**
 * @format
 * */

/**
 * External dependencies
 */
import { Platform } from 'react-native';

/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	setupDriver,
	isLocalEnvironment,
	stopDriver } from './helpers/utils';
import testData from './helpers/test-data';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 240000;

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

	it( 'should be able to add a new List block', async () => {
		await editorPage.addNewListBlock();
		const listBlockElement = await editorPage.getListBlockAtPosition( 1 );

		// Send the first list item text
		await editorPage.sendTextToListBlock( listBlockElement, testData.listItem1 );

		// send an Enter
		await editorPage.sendTextToParagraphBlock( listBlockElement, '\n' );

		// Send the second list item text
		await editorPage.sendTextToListBlock( listBlockElement, testData.listItem2 );

		if ( Platform.OS === 'android' ) {
			// switch to html and verify html
			await editorPage.verifyHtmlContent( testData.listHtml );
		} else {
			// TODO: implement html verification on iOS too
		}
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
