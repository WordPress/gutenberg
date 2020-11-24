/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import { setupDriver, isLocalEnvironment, stopDriver } from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor File Block tests @canary', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const fileBlockName = 'File';

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

	it( 'should be able to add an image block', async () => {
		await editorPage.addNewBlock( fileBlockName );
		await editorPage.verifyHtmlContent( testData.fileBlockPlaceholder );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
