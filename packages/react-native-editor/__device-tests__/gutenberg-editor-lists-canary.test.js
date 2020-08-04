/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	isAndroid,
	isLocalEnvironment,
	setupDriver,
	stopDriver,
} from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor tests for List block @canary', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const listBlockName = 'List';

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
		await editorPage.addNewBlock( listBlockName );
		const listBlockElement = await editorPage.getBlockAtPosition(
			listBlockName
		);
		// Click List block on Android to force EditText focus
		if ( isAndroid() ) {
			await listBlockElement.click();
		}

		// Send the first list item text
		await editorPage.sendTextToListBlock(
			listBlockElement,
			testData.listItem1
		);

		// send an Enter
		await editorPage.sendTextToListBlock( listBlockElement, '\n' );

		// Send the second list item text
		await editorPage.sendTextToListBlock(
			listBlockElement,
			testData.listItem2
		);

		// switch to html and verify html
		await editorPage.verifyHtmlContent( testData.listHtml );
	} );

	// This test depends on being run immediately after 'should be able to add a new List block'
	it( 'should update format to ordered list, using toolbar button', async () => {
		let listBlockElement = await editorPage.getBlockAtPosition(
			listBlockName
		);

		// Click List block to force EditText focus
		await listBlockElement.click();

		// Send a click on the order list format button
		await editorPage.clickOrderedListToolBarButton();

		// switch to html and verify html
		await editorPage.verifyHtmlContent( testData.listHtmlOrdered );

		// Remove list block to return editor to empty state
		listBlockElement = await editorPage.getBlockAtPosition( listBlockName );
		await listBlockElement.click();
		await editorPage.removeBlockAtPosition( listBlockName );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
