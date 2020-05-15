/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import { setupDriver, isLocalEnvironment, stopDriver } from './helpers/utils';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor Gallery Block tests', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const galleryBlockName = 'Gallery';

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

	it( 'should be able to add a gallery block', async () => {
		await editorPage.addNewBlock( galleryBlockName );
		const galleryBlock = await editorPage.getBlockAtPosition(
			galleryBlockName
		);

		expect( galleryBlock ).toBeTruthy();
		await editorPage.removeBlockAtPosition( galleryBlockName );
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
