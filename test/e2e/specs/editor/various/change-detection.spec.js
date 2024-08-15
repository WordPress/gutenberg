/**
 * WordPress dependencies
 */
const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 */

/** @type {ReturnType<typeof base.extend<{changeDetectionUtils: ChangeDetectionUtils}>>} */
const test = base.extend( {
	changeDetectionUtils: async ( { page }, use ) => {
		await use( new ChangeDetectionUtils( { page } ) );
	},
} );

const POST_URLS = [
	'/wp/v2/posts',
	`rest_route=${ encodeURIComponent( '/wp/v2/posts' ) }`,
];

test.describe( 'Change detection', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { changeDetectionUtils } ) => {
		await changeDetectionUtils.releaseSaveIntercept();
	} );

	test( 'Should not save on new unsaved post', async ( {
		pageUtils,
		changeDetectionUtils,
	} ) => {
		const getHadInterceptedSave =
			await changeDetectionUtils.interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pageUtils.pressKeys( 'primary+s' );

		await expect.poll( getHadInterceptedSave ).toBe( false );
	} );

	test( 'Should autosave post', async ( {
		page,
		editor,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		// Force autosave to occur immediately.
		await Promise.all( [
			page.evaluate( () =>
				window.wp.data.dispatch( 'core/editor' ).autosave()
			),
			expect(
				page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'saved' } )
			).toBeDisabled(),
		] );

		// Autosave draft as same user should do full save, i.e. not dirty.
		expect( await changeDetectionUtils.getIsDirty() ).toBe( false );
	} );

	test( 'Should prompt to confirm unsaved changes for autosaved draft for non-content fields', async ( {
		page,
		editor,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		// Toggle post as needing review (not persisted for autosave).
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'button', { name: 'Change post status:' } )
			.click();
		await page.getByRole( 'radio', { name: 'Pending' } ).click();
		// Force autosave to occur immediately.
		await Promise.all( [
			page.evaluate( () =>
				window.wp.data.dispatch( 'core/editor' ).autosave()
			),
			expect(
				page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'saved' } )
			).toBeHidden(),
		] );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should prompt to confirm unsaved changes for autosaved published post', async ( {
		page,
		editor,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		await editor.publishPost();

		// Close publish panel.
		await page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Close panel' } )
			.click();

		const updateButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } );
		await expect( updateButton ).toBeDisabled();

		// Should be dirty after autosave change of published post.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.type( '!' );

		// Force autosave to occur immediately.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);
		await expect( updateButton ).toBeEnabled();

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should not prompt to confirm unsaved changes for new post', async ( {
		changeDetectionUtils,
	} ) => {
		expect( await changeDetectionUtils.getIsDirty() ).toBe( false );
	} );

	test( 'Should prompt to confirm unsaved changes for new post with initial edits', async ( {
		admin,
		changeDetectionUtils,
	} ) => {
		await admin.createNewPost( {
			title: 'My New Post',
			content: 'My content',
			excerpt: 'My excerpt',
		} );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should prompt if property changed without save', async ( {
		editor,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should prompt if content added without save', async ( {
		editor,
		page,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Paragraph' );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should not prompt if changes saved', async ( {
		editor,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		await editor.saveDraft();

		expect( await changeDetectionUtils.getIsDirty() ).toBe( false );
	} );

	test( 'Should not prompt if changes saved right after typing', async ( {
		page,
		editor,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Hello World' );

		await editor.saveDraft();

		expect( await changeDetectionUtils.getIsDirty() ).toBe( false );
	} );

	test( 'Should not save if all changes saved', async ( {
		editor,
		pageUtils,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		await editor.saveDraft();

		const getHadInterceptedSave =
			await changeDetectionUtils.interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pageUtils.pressKeys( 'primary+s' );

		await expect.poll( getHadInterceptedSave ).toBe( false );
	} );

	test( 'Should prompt if save failed', async ( {
		page,
		context,
		editor,
		pageUtils,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		await context.setOffline( true );

		// Keyboard shortcut Ctrl+S save.
		await pageUtils.pressKeys( 'primary+s' );
		// Ensure save update fails and presents button.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor content' } )
				.getByText( 'Updating failed. You are probably offline.' )
		).toBeVisible();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save draft' } )
		).toBeEnabled();

		// Need to disable offline to allow reload.
		await context.setOffline( false );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should prompt if changes and save is in-flight', async ( {
		editor,
		pageUtils,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early. Other requests should be allowed to continue,
		// for example the page reload test.
		await changeDetectionUtils.interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pageUtils.pressKeys( 'primary+s' );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should prompt if changes made while save is in-flight', async ( {
		editor,
		pageUtils,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early. Other requests should be allowed to continue,
		// for example the page reload test.
		await changeDetectionUtils.interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pageUtils.pressKeys( 'primary+s' );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World!' );

		await changeDetectionUtils.releaseSaveIntercept();

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should prompt if property changes made while save is in-flight, and save completes', async ( {
		page,
		editor,
		pageUtils,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early.
		await changeDetectionUtils.interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pageUtils.pressKeys( 'primary+s' );

		// Dirty post while save is in-flight.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.type( '!' );

		// Allow save to complete. Disabling interception flushes pending.
		await Promise.all( [
			expect(
				page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Saved' } )
			).toBeDisabled(),
			changeDetectionUtils.releaseSaveIntercept(),
		] );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'Should prompt if block revision is made while save is in-flight, and save completes', async ( {
		page,
		editor,
		pageUtils,
		changeDetectionUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early.
		await changeDetectionUtils.interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pageUtils.pressKeys( 'primary+s' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Paragraph' );

		// Allow save to complete. Disabling interception flushes pending.
		await Promise.all( [
			expect(
				page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Saved' } )
			).toBeDisabled(),
			changeDetectionUtils.releaseSaveIntercept(),
		] );

		expect( await changeDetectionUtils.getIsDirty() ).toBe( true );
	} );

	test( 'should save posts without titles and persist and overwrite the auto draft title', async ( {
		page,
		editor,
		changeDetectionUtils,
	} ) => {
		// Enter content.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Paragraph' );

		// Save.
		await editor.saveDraft();

		// Verify that the title is empty.
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toHaveText( '' );

		// Verify that the post is not dirty.
		expect( await changeDetectionUtils.getIsDirty() ).toBe( false );
	} );

	test( 'should not prompt to confirm unsaved changes when trashing an existing post', async ( {
		page,
		editor,
	} ) => {
		// Enter title.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );

		// Save.
		await editor.saveDraft();

		// Trash post.
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();
		await page
			.getByRole( 'menu' )
			.getByRole( 'menuitem', { name: 'Move to trash' } )
			.click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Trash' } )
			.click();

		await expect( page ).toHaveURL( '/wp-admin/edit.php?post_type=post' );
	} );

	test( 'consecutive edits to the same attribute should mark the post as dirty after a save', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		// Open the sidebar block settings.
		await editor.openDocumentSettingsSidebar();

		// Insert a paragraph.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Hello, World!' );

		// Save and wait till the post is clean.
		await Promise.all( [
			expect(
				page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'saved' } )
			).toBeDisabled(),
			pageUtils.pressKeys( 'primary+s' ),
		] );

		// Change the paragraph's `drop cap`.
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await page
			.getByRole( 'menu', { name: 'Typography options' } )
			.getByRole( 'menuitemcheckbox', { name: 'Show drop cap' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'checkbox', { name: 'Drop cap' } )
			.setChecked( true );

		// Check that the post is dirty.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save draft' } )
		).toBeEnabled();

		// Save and wait till the post is clean.
		await Promise.all( [
			expect(
				page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'saved' } )
			).toBeDisabled(),
			pageUtils.pressKeys( 'primary+s' ),
		] );

		// Change the paragraph's `drop cap` again.
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'checkbox', { name: 'Drop cap' } )
			.setChecked( false );

		// Check that the post is dirty.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save draft' } )
		).toBeEnabled();
	} );
} );

class ChangeDetectionUtils {
	/** @type {Page} */
	#page;
	/** @type {(() => void) | null} */
	#continueInterceptedSave = null;

	constructor( { page } ) {
		this.#page = page;
	}

	/**
	 * @return {Promise<boolean>} Whether the post is dirty.
	 */
	getIsDirty = async () => {
		return await test.step(
			'assert the post is dirty',
			async () => {
				const hasDialog = new Promise( ( resolve ) => {
					this.#page.on( 'dialog', ( dialog ) => {
						void dialog.accept();
						resolve( dialog.type() === 'beforeunload' );
					} );
					this.#page.on( 'load', () => resolve( false ) );
				} );
				await this.#page.reload( { waitUntil: 'commit' } ); // No need to wait for the full load.
				return hasDialog;
			},
			{ box: true }
		);
	};

	interceptSave = async () => {
		let hadInterceptedSave = false;

		const deferred = new Promise( ( res ) => {
			this.#continueInterceptedSave = res;
		} );

		await this.#page.route(
			( url ) =>
				POST_URLS.some( ( postUrl ) => url.href.includes( postUrl ) ),
			async ( route ) => {
				hadInterceptedSave = true;
				await deferred;
				await route.continue();
			}
		);

		return () => hadInterceptedSave;
	};

	releaseSaveIntercept = async () => {
		this.#continueInterceptedSave?.();
		await this.#page.unroute( ( url ) =>
			POST_URLS.some( ( postUrl ) => url.href.includes( postUrl ) )
		);
		this.#continueInterceptedSave = null;
	};
}
