const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Resolves the current theme's user global styles post - the record Style Book
 * notes are stored against - the same way the editor does, by following the
 * active theme's `wp:user-global-styles` link.
 *
 * @param {Object} requestUtils Playwright request utils.
 * @return {Promise<number|undefined>} The post id.
 */
async function getGlobalStylesId( requestUtils ) {
	const themes = await requestUtils.rest( {
		path: '/wp/v2/themes',
		params: { status: 'active' },
	} );
	const href =
		themes?.[ 0 ]?._links?.[ 'wp:user-global-styles' ]?.[ 0 ]?.href;

	return href ? parseInt( href.split( '/' ).pop(), 10 ) : undefined;
}

/**
 * Deletes every Style Book note on the active theme.
 *
 * `requestUtils.deleteAllComments` queries without a post, and notes on a
 * non-public post type are not what that sweep is built for, so this targets
 * the global styles post directly.
 *
 * @param {Object} requestUtils Playwright request utils.
 */
async function deleteStyleBookNotes( requestUtils ) {
	const globalStylesId = await getGlobalStylesId( requestUtils );
	if ( ! globalStylesId ) {
		return;
	}

	const notes = await requestUtils.rest( {
		path: '/wp/v2/comments',
		params: {
			post: globalStylesId,
			type: 'note',
			status: 'all',
			per_page: 100,
		},
	} );

	await Promise.all(
		notes.map( ( note ) =>
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/comments/${ note.id }`,
				params: { force: true },
			} )
		)
	);
}

test.describe( 'Style Book notes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await deleteStyleBookNotes( requestUtils );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await deleteStyleBookNotes( requestUtils );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	/**
	 * Opens the site editor with the Style Book showing, on the Text tab where
	 * the Headings example lives.
	 *
	 * @param {Object} context
	 * @param {Object} context.admin  Admin utils.
	 * @param {Object} context.editor Editor utils.
	 * @param {Object} context.page   Playwright page.
	 */
	async function openStyleBook( { admin, editor, page } ) {
		await admin.visitSiteEditor();
		await editor.canvas.locator( 'body' ).click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page.getByRole( 'button', { name: 'Style Book' } ).click();
		await expect(
			page.locator( 'role=region[name="Style Book"i]' )
		).toBeVisible();
		await page.getByRole( 'tab', { name: 'Text' } ).click();
	}

	const styleBookFrame = ( page ) =>
		page.frameLocator( '[name="style-book-canvas"]' );

	test( 'adds a note to an example and lists it under that example', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();

		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect( sidebar ).toBeVisible();

		// Focus follows the request from the canvas into the form.
		const input = sidebar.getByRole( 'textbox', {
			name: 'New note on Headings',
		} );
		await expect( input ).toBeFocused();

		await input.fill( 'These headings need more contrast.' );
		await sidebar.getByRole( 'button', { name: 'Add note' } ).click();

		await expect(
			sidebar.getByRole( 'heading', { name: 'Headings' } )
		).toBeVisible();
		await expect(
			sidebar.getByText( 'These headings need more contrast.' )
		).toBeVisible();

		// The example now advertises its note rather than offering to add one.
		await expect(
			styleBookFrame( page ).getByRole( 'button', {
				name: '1 note on Headings',
			} )
		).toBeVisible();
	} );

	test( 'adds a second note to an example that already has one', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();

		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await sidebar
			.getByRole( 'textbox', { name: 'New note on Headings' } )
			.fill( 'First note.' );
		await sidebar.getByRole( 'button', { name: 'Add note' } ).click();
		await expect( sidebar.getByText( 'First note.' ) ).toBeVisible();

		/*
		 * The canvas button now points at the notes the example has, so a
		 * second one is started from that example's group in the sidebar.
		 */
		await sidebar
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();

		const secondInput = sidebar.getByRole( 'textbox', {
			name: 'New note on Headings',
		} );
		await expect( secondInput ).toBeFocused();
		await secondInput.fill( 'Second note.' );
		await sidebar
			.getByRole( 'treeitem', { name: 'New note on Headings' } )
			.getByRole( 'button', { name: 'Add note' } )
			.click();

		await expect( sidebar.getByText( 'First note.' ) ).toBeVisible();
		await expect( sidebar.getByText( 'Second note.' ) ).toBeVisible();
		await expect(
			styleBookFrame( page ).getByRole( 'button', {
				name: '2 notes on Headings',
			} )
		).toBeVisible();
	} );

	test( 'closing the notes sidebar leaves the Style Book standing', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect( sidebar ).toBeVisible();

		await sidebar
			.getByRole( 'button', { name: 'Close Style Book notes' } )
			.click();

		// The notes were about the Style Book, so closing them is a return to
		// Styles rather than a departure from it.
		await expect(
			page.locator( 'role=region[name="Style Book"i]' )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Style Book', pressed: true } )
		).toBeVisible();
	} );

	test( 'stores the note on global styles with the example as its anchor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();

		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await sidebar
			.getByRole( 'textbox', { name: 'New note on Headings' } )
			.fill( 'Anchored note.' );
		await sidebar.getByRole( 'button', { name: 'Add note' } ).click();
		await expect( sidebar.getByText( 'Anchored note.' ) ).toBeVisible();

		const globalStylesId = await getGlobalStylesId( requestUtils );
		const notes = await requestUtils.rest( {
			path: '/wp/v2/comments',
			params: {
				post: globalStylesId,
				type: 'note',
				status: 'all',
			},
		} );

		expect( notes ).toHaveLength( 1 );
		expect( notes[ 0 ].post ).toBe( globalStylesId );
		expect( notes[ 0 ].meta._wp_note_anchor ).toBe( 'core/heading' );
	} );

	test( 'persists notes across a reload and scrolls to the anchored example', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();
		let sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		await sidebar
			.getByRole( 'textbox', { name: 'New note on Headings' } )
			.fill( 'Still here after a reload.' );
		await sidebar.getByRole( 'button', { name: 'Add note' } ).click();
		await expect(
			sidebar.getByText( 'Still here after a reload.' )
		).toBeVisible();

		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: '1 note on Headings' } )
			.click();

		sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		await expect(
			sidebar.getByText( 'Still here after a reload.' )
		).toBeVisible();

		await sidebar
			.getByRole( 'treeitem', { name: /Note on Headings/ } )
			.click();

		const example = styleBookFrame( page ).locator(
			'#example-core\\/heading'
		);
		await expect( example ).toHaveClass( /is-note-anchor-highlighted/ );
		await expect( example ).toBeInViewport();
	} );

	test( 'replies to, resolves and reopens a note', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await sidebar
			.getByRole( 'textbox', { name: 'New note on Headings' } )
			.fill( 'Root note.' );
		await sidebar.getByRole( 'button', { name: 'Add note' } ).click();
		await expect( sidebar.getByText( 'Root note.' ) ).toBeVisible();

		const thread = sidebar.getByRole( 'treeitem', {
			name: /Note on Headings/,
		} );
		await thread.click();

		await sidebar
			.getByRole( 'textbox', { name: /Reply to note/ } )
			.fill( 'Agreed.' );
		await sidebar
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect( sidebar.getByText( 'Agreed.' ) ).toBeVisible();

		await thread.click();
		await sidebar.getByRole( 'button', { name: 'Resolve' } ).click();

		// Resolved threads collect under the divider within their example.
		await expect(
			sidebar.getByText( 'Resolved', { exact: true } )
		).toBeVisible();

		await thread.click();
		await sidebar
			.getByRole( 'textbox', { name: /Reply to note/ } )
			.fill( 'Reopening.' );
		await sidebar.getByRole( 'button', { name: 'Reopen & Reply' } ).click();
		await expect( sidebar.getByText( 'Reopening.' ) ).toBeVisible();
	} );

	test( 'keeps notes per theme', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		await styleBookFrame( page )
			.getByRole( 'button', { name: 'Add note on Headings' } )
			.click();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await sidebar
			.getByRole( 'textbox', { name: 'New note on Headings' } )
			.fill( 'Empty theme note.' );
		await sidebar.getByRole( 'button', { name: 'Add note' } ).click();
		await expect( sidebar.getByText( 'Empty theme note.' ) ).toBeVisible();

		// Notes live on the per-theme global styles record, so another theme
		// starts clean.
		await requestUtils.activateTheme( 'twentytwentyfour' );
		await openStyleBook( { admin, editor, page } );
		await expect(
			styleBookFrame( page ).getByRole( 'button', {
				name: 'Add note on Headings',
			} )
		).toBeVisible();

		await requestUtils.activateTheme( 'emptytheme' );
		await openStyleBook( { admin, editor, page } );
		await expect(
			styleBookFrame( page ).getByRole( 'button', {
				name: '1 note on Headings',
			} )
		).toBeVisible();
	} );

	test( 'leaves the example keyboard navigation alone', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openStyleBook( { admin, editor, page } );

		// The notes button sits beside each example rather than inside it, so
		// the examples remain the only members of the composite and arrow keys
		// still move between them.
		const headings = styleBookFrame( page ).getByRole( 'button', {
			name: 'Open Headings styles in Styles panel',
		} );
		await headings.focus();
		await expect( headings ).toBeFocused();

		await page.keyboard.press( 'ArrowDown' );

		// Focus moves to the next example, not to a notes button.
		const focusedLabel = await styleBookFrame( page )
			.locator( ':focus' )
			.getAttribute( 'aria-label' );
		expect( focusedLabel ).toMatch( /Open .+ styles in Styles panel/ );
	} );
} );
