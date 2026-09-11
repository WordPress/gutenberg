/**
 * E2E coverage for revealing a suggestion's in-content marker (#73411, F-31).
 *
 * Selecting a note in the sidebar used to stop at selecting its block: the
 * marker itself kept its resting treatment and the canvas never moved, so on a
 * long post the reviewer had to hunt for the run the note was about. The
 * second test covers the other half of the same finding — a floating note card
 * landing on top of another card's review controls and swallowing the click.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

async function switchIntent( page: any, intentLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

/**
 * Type a suggested addition at the end of the nth paragraph and wait for the
 * marker to pick up its server-minted id.
 *
 * @param {import('@playwright/test').Page} page   Playwright page.
 * @param {Object}                          editor Editor fixture.
 * @param {number}                          index  Paragraph index.
 * @return {Promise<import('@playwright/test').Locator>} The marker locator.
 */
async function suggestAdditionIn( page: any, editor: any, index: number ) {
	const paragraph = editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.nth( index );
	await paragraph.click();
	await page.keyboard.press( 'End' );
	await page.keyboard.type( ' edit' );
	const marker = paragraph.locator(
		'mark.wp-suggestion[data-suggestion-type="add"]'
	);
	await expect( marker ).toHaveAttribute( 'data-suggestion-id', /\d/ );
	return marker;
}

/**
 * Open the docked notes sidebar. Notes no longer open it on their own, so a
 * test that needs the panel has to ask for it.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 */
async function openNotesSidebar( page: any ) {
	const allNotesToggle = page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'All notes', exact: true } );
	if (
		( await allNotesToggle.getAttribute( 'aria-expanded' ) ) === 'false'
	) {
		await allNotesToggle.click();
	}
}

test.describe( 'Suggestion marker reveal', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'selecting a note scrolls to its marker and marks it active', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello' },
		} );
		// Enough content below the marker that it leaves the viewport.
		for ( let i = 0; i < 30; i++ ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `Filler paragraph number ${ i }` },
			} );
		}

		await switchIntent( page, 'Suggesting' );
		const marker = await suggestAdditionIn( page, editor, 0 );

		// Open "All notes" and scroll the marker out of sight.
		await openNotesSidebar( page );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.last()
			.scrollIntoViewIfNeeded();
		await expect( marker ).not.toBeInViewport();

		// Clicking the note brings its marker back into view…
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem' )
			.first()
			.click();
		await expect( marker ).toBeInViewport();

		// …and gives the marker itself an active treatment, so a block
		// holding several markers still points at the right one.
		await expect( marker ).toHaveCSS( 'outline-style', 'solid' );
		await expect( marker ).not.toHaveCSS(
			'background-color',
			'rgba(0, 0, 0, 0)'
		);
	} );

	test( 'floating note cards never stack on top of one another', async ( {
		editor,
		page,
	} ) => {
		await page.setViewportSize( { width: 1600, height: 900 } );
		for ( let i = 0; i < 3; i++ ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: `Paragraph ${ i }` },
			} );
		}

		await switchIntent( page, 'Suggesting' );
		for ( let i = 0; i < 3; i++ ) {
			await suggestAdditionIn( page, editor, i );
		}

		/*
		 * Sample the floating board as it mounts, counting only the cards
		 * that can take a click. A card the board has not placed yet used to
		 * fall back to the panel's origin, where it covered whichever card
		 * legitimately sat at the top - and being later in tree order, it
		 * took that card's clicks with it.
		 *
		 * Headless Chromium only runs animation frames when something
		 * paints, so the frame loop is best effort; the settled board is
		 * sampled explicitly once every card has been placed.
		 */
		await page.evaluate( () => {
			const overlaps: string[] = [];
			let maxCards = 0;
			const sample = () => {
				const boxes = Array.from(
					document.querySelectorAll(
						'.editor-collab-sidebar-panel__thread.is-floating'
					)
				)
					.filter(
						( el ) =>
							window.getComputedStyle( el ).pointerEvents !==
							'none'
					)
					.map( ( el ) => el.getBoundingClientRect() )
					.sort( ( a, b ) => a.top - b.top );
				maxCards = Math.max( maxCards, boxes.length );
				for ( let i = 1; i < boxes.length; i++ ) {
					if ( boxes[ i ].top < boxes[ i - 1 ].bottom ) {
						overlaps.push(
							`${ Math.round(
								boxes[ i - 1 ].top
							) }-${ Math.round(
								boxes[ i - 1 ].bottom
							) } over ${ Math.round(
								boxes[ i ].top
							) }-${ Math.round( boxes[ i ].bottom ) }`
						);
					}
				}
				return { overlaps, maxCards };
			};
			let stopped = false;
			const tick = () => {
				sample();
				if ( ! stopped ) {
					window.requestAnimationFrame( tick );
				}
			};
			( window as any ).__f31Finish = () => {
				stopped = true;
				return sample();
			};
			tick();
		} );

		// Closing the docked sidebar hands the notes over to the floating
		// board, which mounts all three cards at once.
		await openNotesSidebar( page );
		await page.getByRole( 'button', { name: 'Close Notes' } ).click();
		const cards = page.locator(
			'.editor-collab-sidebar-panel__thread.is-floating'
		);
		await expect( cards ).toHaveCount( 3 );
		// Anchor on a positive signal: every card placed by the board. An
		// unplaced card is transparent, which still counts as visible, so
		// wait for the pointer events the board restores on placement.
		for ( const index of [ 0, 1, 2 ] ) {
			await expect( cards.nth( index ) ).not.toHaveCSS(
				'pointer-events',
				'none'
			);
		}
		await expect(
			page.getByRole( 'button', { name: 'Accept suggestion' } )
		).toHaveCount( 3 );

		const { overlaps, maxCards } = await page.evaluate( () =>
			( window as any ).__f31Finish()
		);
		// The settled board was sampled with every card placed, and no
		// sampled frame had two cards overlapping.
		expect( maxCards ).toBe( 3 );
		expect( overlaps ).toEqual( [] );
	} );
} );
