const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Escape region navigation', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	async function hasTextSelection( page ) {
		return page.evaluate( () => {
			const { getSelectionStart } =
				window.wp.data.select( 'core/block-editor' );
			return getSelectionStart().attributeKey !== undefined;
		} );
	}

	test( 'steps from the text out to the regions', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.canvas.getByText( 'First' ).click();
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );

		// Escape steps out of the canvas onto the content region. The block
		// selection is left as it is.
		await page.keyboard.press( 'Escape' );
		const editorContent = page.locator(
			'role=region[name="Editor content"i]'
		);
		await expect( editorContent ).toBeFocused();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { content: 'First' } },
			] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlockClientIds().length
				)
			)
			.toBe( 1 );

		// On a region, Escape moves to the next region, which for a selected
		// block is its toolbar, and Shift+Escape moves back.
		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator( 'role=region[name="Block toolbar"i]' )
		).toBeFocused();
		await page.keyboard.press( 'Shift+Escape' );
		await expect( editorContent ).toBeFocused();
	} );

	test( 'skips regions that are not visible', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.canvas.getByText( 'First' ).click();
		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator( 'role=region[name="Editor content"i]' )
		).toBeFocused();

		// Walk the whole cycle back to the starting region: the publish
		// region, present in the DOM but hidden while its panel is closed,
		// must never receive focus.
		const visited = [];
		for ( let i = 0; i < 8; i++ ) {
			await page.keyboard.press( 'Escape' );
			const name = await page.evaluate( () =>
				document.activeElement.getAttribute( 'aria-label' )
			);
			if ( name === 'Editor content' ) {
				break;
			}
			visited.push( name );
		}
		expect( visited ).not.toContain( 'Editor publish' );
		expect( visited.length ).toBeLessThan( 8 );
	} );

	test( 'steps out onto the wrapping region from the editor chrome', async ( {
		page,
	} ) => {
		// Move focus into the top bar, on the inserter toggle.
		await page.getByRole( 'button', { name: 'Block Inserter' } ).focus();

		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator( 'role=region[name="Editor top bar"i]' )
		).toBeFocused();
	} );

	test( 'closes an open popover without moving focus', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/heading' );
		await expect(
			page.locator( 'role=option[name="Heading"i]' )
		).toBeVisible();

		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator( 'role=option[name="Heading"i]' )
		).toBeHidden();
		// The caret stays in the text; nothing stepped out.
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { content: '/heading' } },
			] );
	} );

	test( 'still undoes an automatic change first', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ' );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { name: 'core/list' } ] );

		await page.keyboard.press( 'Escape' );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { content: '* ' } },
			] );
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );
	} );

	test( 'still collapses a multi selection first', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );
		await editor.canvas.getByText( 'Second' ).click();
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlockClientIds().length
				)
			)
			.toBe( 2 );

		await page.keyboard.press( 'Escape' );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlockClientIds().length
				)
			)
			.toBe( 1 );
		// Focus stays in the canvas rather than jumping to a region.
		await expect(
			page.locator( 'role=region[name="Editor content"i]' )
		).not.toBeFocused();
	} );
} );
