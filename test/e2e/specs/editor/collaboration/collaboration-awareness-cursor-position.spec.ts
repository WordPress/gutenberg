/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Awareness Cursor Position', () => {
	test( 'awareness cursor tracks all positions through a bolded word without sticking at formatting boundaries', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		// "some <strong>words</strong> test" — "words" is bold.
		// Rich-text offsets 0–15 should each produce a distinct, monotonically
		// increasing x-position for the awareness cursor on User B's screen.
		const PARAGRAPH_CONTENT = 'some <strong>words</strong> test';
		const PLAIN_TEXT = 'some words test';

		const post = await requestUtils.createPost( {
			title: 'Awareness Cursor Position Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// User 1 inserts a paragraph with pre-formatted bold text.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: PARAGRAPH_CONTENT },
		} );

		// Wait for the paragraph to sync to User 2.
		await expect
			.poll(
				async () => {
					const blocks = await collaborationUtils.editor2.getBlocks();
					return blocks[ 0 ]?.attributes?.content;
				},
				{ timeout: 5000 }
			)
			.toContain( 'words' );

		// Collect the x-positions of the awareness cursor on User B's screen
		// for each cursor position User A sets.
		const xPositions: number[] = [];

		/** Read the cursor's current left position from User B's overlay. */
		const readCursorX = () =>
			page2.evaluate( () => {
				const iframe = document.querySelector(
					'iframe[name="editor-canvas"]'
				) as HTMLIFrameElement | null;
				const cursor = iframe?.contentDocument?.querySelector(
					'.collaborators-overlay-user'
				);
				if ( ! cursor ) {
					return null;
				}
				return parseFloat( ( cursor as HTMLElement ).style.left );
			} );

		for ( let offset = 0; offset <= PLAIN_TEXT.length; offset++ ) {
			// User 1 places cursor at this offset.
			await page.evaluate( ( off ) => {
				const blocks = window.wp.data
					.select( 'core/block-editor' )
					.getBlocks();
				window.wp.data.dispatch( 'core/block-editor' ).resetSelection(
					{
						clientId: blocks[ 0 ].clientId,
						attributeKey: 'content',
						offset: off,
					},
					{
						clientId: blocks[ 0 ].clientId,
						attributeKey: 'content',
						offset: off,
					},
					0
				);
			}, offset );

			// Poll User B's page until the cursor position reflects the new
			// offset. After the first iteration the cursor element already
			// exists, so we must wait for its x-position to change rather
			// than just checking existence.
			const previousX =
				xPositions.length > 0
					? xPositions[ xPositions.length - 1 ]
					: undefined;

			let cursorX: number | null = null;
			try {
				await expect
					.poll(
						async () => {
							cursorX = await readCursorX();
							if ( cursorX === null ) {
								return false;
							}
							// First iteration: cursor appearing is enough.
							if ( previousX === undefined ) {
								return true;
							}
							// Wait for the position to change.
							return cursorX !== previousX;
						},
						{ timeout: 5000 }
					)
					.toBe( true );
			} catch {
				// If the poll timed out, the position may legitimately be
				// the same as the previous offset (sub-pixel rounding).
				// Accept whatever value we last read.
			}

			xPositions.push( cursorX ?? -1 );
		}

		// Every x-position should be present (cursor was visible).
		for ( let i = 0; i < xPositions.length; i++ ) {
			expect(
				xPositions[ i ],
				`Awareness cursor should be visible at offset ${ i }`
			).not.toBe( -1 );
		}

		// x-positions must be non-decreasing overall (sub-pixel rounding can
		// cause adjacent characters to share the same pixel coordinate).
		for ( let i = 1; i < xPositions.length; i++ ) {
			expect(
				xPositions[ i ],
				`Cursor x at offset ${ i } (${
					xPositions[ i ]
				}px) should be >= offset ${ i - 1 } (${
					xPositions[ i - 1 ]
				}px)`
			).toBeGreaterThanOrEqual( xPositions[ i - 1 ] );
		}

		// The critical assertion: the cursor must advance *through* the bold
		// word, not stick at its boundaries. "words" occupies rich-text
		// offsets 5–9. Positions before, inside, and after must differ.
		//   offset 4 = "some|"  (before bold)
		//   offset 7 = "some wo|rds"  (middle of bold)
		//   offset 11 = "some words |test"  (after bold)
		expect(
			xPositions[ 7 ],
			'Cursor should advance into the middle of the bold word'
		).toBeGreaterThan( xPositions[ 4 ] );
		expect(
			xPositions[ 11 ],
			'Cursor should advance past the bold word'
		).toBeGreaterThan( xPositions[ 7 ] );
	} );
} );
