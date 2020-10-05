/**
 * Internal dependencies
 */
import EditorPage from './pages/editor-page';
import {
	backspace,
	setupDriver,
	isLocalEnvironment,
	clickMiddleOfElement,
	clickBeginningOfElement,
	stopDriver,
	swipeUp,
	isAndroid,
} from './helpers/utils';
import testData from './helpers/test-data';

jest.setTimeout( 1000000 );

describe( 'Gutenberg Editor tests for Paragraph Block', () => {
	let driver;
	let editorPage;
	let allPassed = true;
	const paragraphBlockName = 'Paragraph';

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

	it( 'should be able to add a new Paragraph block', async () => {
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.shortText
		);
		await editorPage.removeBlockAtPosition( paragraphBlockName );
	} );

	it( 'should be able to split one paragraph block into two', async () => {
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.shortText
		);
		const textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);
		await clickMiddleOfElement( driver, textViewElement );
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'\n',
			false
		);
		expect(
			( await editorPage.hasBlockAtPosition( 1, paragraphBlockName ) ) &&
				( await editorPage.hasBlockAtPosition( 2, paragraphBlockName ) )
		).toBe( true );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		expect( text0 ).not.toBe( '' );
		expect( text1 ).not.toBe( '' );
		expect( testData.shortText ).toMatch(
			new RegExp( `${ text0 + text1 }|${ text0 } ${ text1 }` )
		);

		await editorPage.removeBlockAtPosition( paragraphBlockName, 2 );
		await editorPage.removeBlockAtPosition( paragraphBlockName );
	} );

	it( 'should be able to merge 2 paragraph blocks into 1', async () => {
		await editorPage.addNewBlock( paragraphBlockName );
		let paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			testData.shortText
		);
		let textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);
		await clickMiddleOfElement( driver, textViewElement );
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			'\n'
		);
		expect(
			( await editorPage.hasBlockAtPosition( 1, paragraphBlockName ) ) &&
				( await editorPage.hasBlockAtPosition( 2, paragraphBlockName ) )
		).toBe( true );

		const text0 = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		const text1 = await editorPage.getTextForParagraphBlockAtPosition( 2 );
		paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName,
			2
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		textViewElement = await editorPage.getTextViewForParagraphBlock(
			paragraphBlockElement
		);
		await clickBeginningOfElement( driver, textViewElement );
		await editorPage.typeTextToParagraphBlock(
			paragraphBlockElement,
			backspace
		);

		const text = await editorPage.getTextForParagraphBlockAtPosition( 1 );
		expect( text0 + text1 ).toMatch( text );

		expect(
			await editorPage.hasBlockAtPosition( 2, paragraphBlockName )
		).toBe( false );
		await editorPage.removeBlockAtPosition( paragraphBlockName );
	} );

	it( 'should be able to create a post with multiple paragraph blocks', async () => {
		await editorPage.addNewBlock( paragraphBlockName );
		const paragraphBlockElement = await editorPage.getBlockAtPosition(
			paragraphBlockName
		);
		if ( isAndroid() ) {
			await paragraphBlockElement.click();
		}

		await editorPage.sendTextToParagraphBlock( 1, testData.longText );

		for ( let i = 3; i > 0; i-- ) {
			await swipeUp( driver );
			await editorPage.removeBlockAtPosition( paragraphBlockName, i );
		}
	} );

	// Restricting these test to Android because I was not able to update the html on iOS
	if ( isAndroid() ) {
		it( 'should be able to merge blocks with unknown html elements', async () => {
			await editorPage.setHtmlContentAndroid( `
<!-- wp:paragraph -->
<p><unknownhtmlelement>abc</unknownhtmlelement>D</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>E</p>
<!-- /wp:paragraph -->` );

			// // Merge paragraphs
			const secondParagraphBlockElement = await editorPage.getBlockAtPosition(
				paragraphBlockName,
				2
			);
			await clickBeginningOfElement(
				driver,
				secondParagraphBlockElement
			);
			await editorPage.typeTextToParagraphBlock(
				secondParagraphBlockElement,
				backspace
			);

			// verify the editor has not crashed
			const text = await editorPage.getTextForParagraphBlockAtPosition(
				1
			);
			expect( text.length ).not.toEqual( 0 );

			await editorPage.removeBlockAtPosition( paragraphBlockName );
		} );

		// Based on https://github.com/wordpress-mobile/gutenberg-mobile/pull/1507
		it( 'should handle multiline paragraphs from web', async () => {
			await editorPage.setHtmlContentAndroid( `
	<!-- wp:paragraph -->
	<p>multiple lines<br><br></p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p></p>
	<!-- /wp:paragraph -->` );

			// // Merge paragraphs
			const secondParagraphBlockElement = await editorPage.getBlockAtPosition(
				paragraphBlockName,
				2
			);
			await clickBeginningOfElement(
				driver,
				secondParagraphBlockElement
			);
			await editorPage.typeTextToParagraphBlock(
				secondParagraphBlockElement,
				backspace
			);

			// verify the editor has not crashed
			const text = await editorPage.getTextForParagraphBlockAtPosition(
				1
			);
			expect( text.length ).not.toEqual( 0 );

			await editorPage.removeBlockAtPosition( paragraphBlockName );
		} );
	}

	afterAll( async () => {
		if ( ! isLocalEnvironment() ) {
			driver.sauceJobStatus( allPassed );
		}
		await stopDriver( driver );
	} );
} );
