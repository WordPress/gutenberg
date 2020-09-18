/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import { setupDriver, isLocalEnvironment, stopDriver } from './helpers/utils';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor Spacer Block test', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const spacerBlockName = 'Spacer';

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

	it( 'should be able to add an separator block', async () => {
		await editorPage.addNewBlock( spacerBlockName );
		const separatorBlock = await editorPage.getBlockAtPosition(
			spacerBlockName
		);

		expect( separatorBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( spacerBlockName );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
