/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import { setupDriver, isLocalEnvironment, stopDriver } from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor Unsupported Block Editor Tests', () => {
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

	it( 'should be able to open the unsupported block web view editor', async () => {
		await editorPage.setHtmlContent( testData.unsupportedBlockHtml );

		const firstVisibleBlock = await editorPage.getFirstBlockVisible();
		await firstVisibleBlock.click();

		const helpButton = await editorPage.getUnsupportedBlockHelpButton();
		await helpButton.click();

		const editButton = await editorPage.getUnsupportedBlockBottomSheetEditButton();
		await editButton.click();

		await expect(
			editorPage.getUnsupportedBlockWebView()
		).resolves.toBeTruthy();
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
