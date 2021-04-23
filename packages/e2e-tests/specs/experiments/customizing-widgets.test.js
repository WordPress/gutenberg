/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	activateTheme,
	deactivatePlugin,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { find } from 'puppeteer-testing-library';

describe( 'Widgets screen', () => {
	beforeEach( async () => {
		await visitAdminPage( 'customize.php' );
	} );

	beforeAll( async () => {
		// TODO: Ideally we can bundle our test theme directly in the repo.
		await activateTheme( 'twentytwenty' );
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		await setWidgetsCustomizerExperiment( true );
	} );

	afterAll( async () => {
		await activatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		await activateTheme( 'twentytwentyone' );
		await setWidgetsCustomizerExperiment( false );
	} );

	it( 'should add blocks', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		const documentTools = await find( {
			role: 'toolbar',
			name: 'Document tools',
		} );

		const addBlockButton = await find(
			{
				role: 'button',
				name: 'Add block',
			},
			{ root: documentTools }
		);
		await addBlockButton.click();

		const paragraphOption = await find( {
			role: 'option',
			name: 'Paragraph',
		} );
		await paragraphOption.click();

		const addedParagraphBlock = await find( {
			role: 'group',
			name: /^Empty block/,
		} );
		await addedParagraphBlock.focus();

		await page.keyboard.type( 'First Paragraph' );

		await addBlockButton.click();

		const headingOption = await find( {
			role: 'option',
			name: 'Heading',
		} );
		await headingOption.click();

		const addedHeadingBlock = await find( {
			role: 'group',
			name: 'Block: Heading',
			level: 2,
		} );
		await addedHeadingBlock.focus();

		await page.keyboard.type( 'My Heading' );

		const inlineAddBlockButton = await find( {
			role: 'combobox',
			name: 'Add block',
			haspopup: 'menu',
		} );
		await inlineAddBlockButton.click();

		const inlineInserterSearchBox = await find( {
			role: 'searchbox',
			name: 'Search for blocks and patterns',
		} );

		await expect( inlineInserterSearchBox ).toHaveFocus();

		await page.keyboard.type( 'Search' );

		const searchOption = await find( {
			role: 'option',
			name: 'Search',
		} );
		await searchOption.click();

		const addedSearchBlock = await find( {
			role: 'group',
			name: 'Block: Search',
		} );

		const searchTitle = await find(
			{
				role: 'textbox',
				name: 'Label text',
			},
			{ root: addedSearchBlock }
		);
		await searchTitle.focus();

		await page.keyboard.type( 'My ' );

		// TODO: It's the only reliable way for now to make sure the iframe is ready.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 3000 );

		const sitePreviewIframe = await find( {
			name: 'Site Preview',
			selector: 'iframe',
		} );
		const contentFrame = await sitePreviewIframe.contentFrame();
		const frameContentDocument = await contentFrame.evaluateHandle(
			'document'
		);

		// Expect the paragraph to be found in the preview iframe.
		await find(
			{
				text: 'First Paragraph',
				selector: '.widget-content p',
			},
			{
				root: frameContentDocument,
			}
		);

		// Expect the heading to be found in the preview iframe.
		await find(
			{
				role: 'heading',
				name: 'My Heading',
				selector: '.widget-content *',
			},
			{
				root: frameContentDocument,
			}
		);

		// Expect the search box to be found in the preview iframe.
		await find(
			{
				role: 'searchbox',
				name: 'My Search',
				selector: '.widget-content *',
			},
			{
				root: frameContentDocument,
			}
		);
	} );
} );

async function setWidgetsCustomizerExperiment( enabled ) {
	await visitAdminPage( 'admin.php', 'page=gutenberg-experiments' );

	const checkbox = await find( {
		role: 'checkbox',
		name: 'Enable Widgets screen in Customizer',
	} );

	const snapshot = await page.accessibility.snapshot( { root: checkbox } );

	if ( snapshot.checked !== enabled ) {
		await checkbox.click();
	}

	const submitButton = await find( {
		role: 'button',
		name: 'Save Changes',
	} );

	await Promise.all( [ submitButton.click(), page.waitForNavigation() ] );
}
