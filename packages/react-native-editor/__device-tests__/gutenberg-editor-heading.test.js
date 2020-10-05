/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	setupDriver,
	isLocalEnvironment,
	stopDriver,
	isAndroid,
} from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor tests @canary', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const paragraphBlockName = 'Paragraph';
	const headingBlockName = 'Heading';

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

	it( 'should be able to create a post with heading and paragraph blocks', async () => {
		await editorPage.addNewBlock( headingBlockName );
		let headingBlockElement = await editorPage.getBlockAtPosition(
			headingBlockName
		);
		if ( isAndroid() ) {
			await headingBlockElement.click();
		}
		await editorPage.sendTextToHeadingBlock(
			headingBlockElement,
			testData.heading,
			false
		);

		await editorPage.addNewBlock( paragraphBlockName );
		let paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			2
		);
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await editorPage.addNewBlock( paragraphBlockName );
		paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			3
		);
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.mediumText
		);

		await editorPage.addNewBlock( headingBlockName );
		headingBlockElement = await editorPage.getBlockAtPosition(
			headingBlockName,
			4
		);
		await editorPage.typeTextToParagraphBlock(
			headingBlockElement,
			testData.heading
		);

		await editorPage.addNewBlock( paragraphBlockName );
		paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			5
		);
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.mediumText
		);
	} );

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
