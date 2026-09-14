const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function navigateToRegion( page, pageUtils, region ) {
	const regionCount = await page
		.locator( '[role="region"][tabindex="-1"]' )
		.count();

	for ( let index = 0; index < regionCount; index++ ) {
		await pageUtils.pressKeys( 'ctrl+`' );
		if (
			await region.evaluate(
				( element ) => element === document.activeElement
			)
		) {
			return;
		}
	}
}

async function expectRegionToFillEditor( page, region, openPanelButton ) {
	await expect( region ).toBeVisible();
	const editor = page
		.locator( '.interface-interface-skeleton' )
		.filter( { has: region } )
		.last();
	const [ regionBox, editorBox, buttonBox ] = await Promise.all( [
		region.boundingBox(),
		editor.boundingBox(),
		openPanelButton.boundingBox(),
	] );

	expect( regionBox.y ).toBe( editorBox.y );
	expect( regionBox.height ).toBe( editorBox.height );
	expect( buttonBox.y ).toBeLessThan( regionBox.y + regionBox.height / 2 );
}

test.describe( 'Region navigation (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'navigates forward and back again', async ( {
		editor,
		page,
	}, testInfo ) => {
		// Insert a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		const dummyParagraph = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
			.filter( { hasText: 'Dummy text' } );

		await expect
			.poll( () => editor.ownsSelection( dummyParagraph ) )
			.toBe( true );

		// Navigate to first region and check that we made it. Must navigate forward 4 times as initial focus is placed in post title field.
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		await page.keyboard.press( 'Control+`' );
		const editorTopBar = page.locator(
			'role=region[name="Editor top bar"i]'
		);
		await expect( editorTopBar ).toBeFocused();

		// Navigate to next/second region and check that we made it.
		await page.keyboard.press( 'Control+`' );
		const editorContent = page.locator(
			'role=region[name="Editor content"i]'
		);
		await expect( editorContent ).toBeFocused();

		// Navigate to previous/first region and check that we made it.
		// Make sure navigating backwards works also with the tilde character,
		// as browsers interpret the combination of the crtl+shift+backtick keys
		// and assign it to event.key inconsistently.
		// See https://github.com/WordPress/gutenberg/pull/45019
		if ( testInfo.project.name === 'chromium' ) {
			await page.keyboard.press( 'Control+Shift+`' );
		} else {
			await page.keyboard.press( 'Control+Shift+~' );
		}

		await expect( editorTopBar ).toBeFocused();
	} );

	test( 'shows a closed publish region at full editor height', async ( {
		page,
		pageUtils,
	} ) => {
		const publishRegion = page.getByRole( 'region', {
			name: 'Editor publish',
		} );

		await navigateToRegion( page, pageUtils, publishRegion );

		await expect( publishRegion ).toBeFocused();
		const openPublishPanel = publishRegion.getByRole( 'button', {
			name: 'Open publish panel',
		} );
		await expect( openPublishPanel ).toBeVisible();
		await expectRegionToFillEditor( page, publishRegion, openPublishPanel );
	} );
} );
