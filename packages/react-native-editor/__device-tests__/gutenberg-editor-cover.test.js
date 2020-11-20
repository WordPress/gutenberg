/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import { setupDriver, isLocalEnvironment, stopDriver } from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor Cover Block test', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const coverBlockName = 'Cover';

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

	it( 'should convert height properly', async () => {
		await editorPage.setHtmlContent( testData.coverHeightWithRemUnit );

		const coverBlock = await editorPage.getBlockAtPosition(
			coverBlockName
		);
		const { height } = await coverBlock.getSize();
		// Height is set to 20rem, where 1rem is 16.
		// There is also block's vertical padding equal 32.
		// Finally, the total height should be 20 * 16 + 32 = 352
		expect( height ).toBe( 352 );

		await coverBlock.click();
		expect( coverBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( coverBlockName );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
