/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	backspace,
	isAndroid,
	isLocalEnvironment,
	setupDriver,
	stopDriver,
} from './helpers/utils';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor tests for List block', () => {
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

	// Prevent regression of https://github.com/wordpress-mobile/gutenberg-mobile/issues/871
	it( 'should handle spaces in a list', async () => {
		await editorPage.addNewBlock( listBlockName );
		let listBlockElement = await editorPage.getBlockAtPosition(
			listBlockName
		);
		// Click List block on Android to force EditText focus
		if ( isAndroid() ) {
			await listBlockElement.click();
		}

		// Send the list item text
		await editorPage.sendTextToListBlock( listBlockElement, '  a' );

		// send an Enter
		await editorPage.sendTextToListBlock( listBlockElement, '\n' );

		// send a backspace
		await editorPage.sendTextToListBlock( listBlockElement, backspace );

		// switch to html and verify html
		await editorPage.verifyHtmlContent( `<!-- wp:list -->
<ul><li>  a</li></ul>
<!-- /wp:list -->` );

		// Remove list block to reset editor to clean state
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
