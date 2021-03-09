/**
 * WordPress dependencies
 */
import {
	insertBlock,
	trashAllPosts,
	activateTheme,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { siteEditor } from '../../experimental-features';

const clickUndoInHeaderToolbar = () =>
	page.click( '.edit-site-header__toolbar button[aria-label="Undo"]' );

const clickRedoInHeaderToolbar = () =>
	page.click( '.edit-site-header__toolbar button[aria-label="Redo"]' );

const waitForNotice = () =>
	page.waitForSelector( '.components-snackbar', { visible: true } );

const clickButtonInNotice = async () => {
	const selector = '.components-snackbar button';
	await page.waitForSelector( selector, {
		visible: true,
	} );
	await page.click( selector );
};

const addDummyText = async () => {
	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Test' );
};

const save = async () => {
	await page.click( '.edit-site-save-button__button' );
	await page.click( '.editor-entities-saved-states__save-button' );
	await page.waitForSelector(
		'.edit-site-save-button__button:not(.is-busy)'
	);
};

const revertTemplate = async () => {
	await page.click( '.edit-site-document-actions__get-info' );
	await page.click( '.edit-site-template-details__revert button' );
	await waitForNotice();
};

describe( 'Template Revert', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );
	beforeEach( async () => {
		await trashAllPosts( 'wp_template' );
		await siteEditor.visit();
	} );

	it( 'should show the original content after revert', async () => {
		const blocksBefore = await siteEditor.getEditedPostContent();

		await addDummyText();
		await save();
		await revertTemplate();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );

	it( 'should show the original content after revert and page reload', async () => {
		const blocksBefore = await siteEditor.getEditedPostContent();

		await addDummyText();
		await save();
		await revertTemplate();
		await siteEditor.visit();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );

	it( 'should show the edited content after revert and clicking undo in the header toolbar', async () => {
		await addDummyText();
		await save();
		const blocksBefore = await siteEditor.getEditedPostContent();

		await revertTemplate();
		await clickUndoInHeaderToolbar();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );

	it( 'should show the edited content after revert and clicking undo in the notice', async () => {
		await addDummyText();
		await save();
		const blocksBefore = await siteEditor.getEditedPostContent();

		await revertTemplate();
		await clickButtonInNotice();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );

	it( 'should show the original content after revert, clicking undo then redo in the header toolbar', async () => {
		const blocksBefore = await siteEditor.getEditedPostContent();

		await addDummyText();
		await save();
		await revertTemplate();
		await clickUndoInHeaderToolbar();
		await clickRedoInHeaderToolbar();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );

	it( 'should show the original content after revert, clicking undo in the notice then undo in the header toolbar', async () => {
		const blocksBefore = await siteEditor.getEditedPostContent();

		await addDummyText();
		await save();
		await revertTemplate();
		await clickButtonInNotice();
		await clickUndoInHeaderToolbar();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );

	it( 'should show the edited content after revert, clicking undo in the header toolbar, save and reload', async () => {
		await addDummyText();
		await save();
		const blocksBefore = await siteEditor.getEditedPostContent();

		await revertTemplate();
		await clickUndoInHeaderToolbar();
		await save();
		await siteEditor.visit();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );

	it( 'should show the edited content after revert, clicking undo in the notice and reload', async () => {
		await addDummyText();
		await save();
		const blocksBefore = await siteEditor.getEditedPostContent();

		await revertTemplate();
		await clickButtonInNotice();
		await siteEditor.visit();

		const blocksAfter = await siteEditor.getEditedPostContent();
		expect( blocksBefore ).toBe( blocksAfter );
	} );
} );
