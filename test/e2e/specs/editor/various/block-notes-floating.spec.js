const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { BlockNoteUtils } = require( './block-notes-utils' );

test.use( {
	blockNoteUtils: async ( { page, editor, pageUtils }, use ) => {
		await use( new BlockNoteUtils( { page, editor, pageUtils } ) );
	},
} );

// A floating thread's top lines up with its anchor: the -16px thread align
// offset is cancelled by the floating panel's 16px margin.
const ALIGN_TOLERANCE = 12;

// A few lines of filler, enough to separate collapsed threads.
const SPACER_TEXT =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(
		3
	);

// Wraps over several lines, so a collapsed thread takes up more room. Few
// words, so the thread's accessible name (a 10-word excerpt) still matches.
const LONG_NOTE =
	'Comprehensive considerations regarding extraordinarily sophisticated implementation characteristics notwithstanding.';

// Enough replies to make a thread taller than its height cap.
const REPLY_COUNT = 6;

test.describe( 'Block Notes: floating sidebar', () => {
	// Tall enough that the selected thread in these tests fits within the
	// viewport. One extending below the fold is scrolled into view, which
	// shifts every thread off its anchor (see the `fixme` test below).
	test.use( { viewport: { width: 1280, height: 900 } } );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	function getSidebar( page ) {
		return page.getByRole( 'region', { name: 'Notes' } );
	}

	function getThread( page, content ) {
		return getSidebar( page ).getByRole( 'treeitem', {
			name: `Note: ${ content }`,
		} );
	}

	function getParagraph( editor, text ) {
		return editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: text } );
	}

	// Top edge in page coordinates of a locator, or of whatever a getter
	// measures (e.g. the text selection).
	async function getTop( target ) {
		return typeof target === 'function'
			? target()
			: ( await target.boundingBox() ).y;
	}

	async function expectAligned( item, anchor ) {
		await expect
			.poll( async () =>
				Math.abs(
					( await getTop( item ) ) - ( await getTop( anchor ) )
				)
			)
			.toBeLessThan( ALIGN_TOLERANCE );
	}

	// Guards that an anchor is far enough below its block's top that
	// aligning to the block instead would fail the test.
	async function expectBelow( anchor, block ) {
		expect(
			( await getTop( anchor ) ) - ( await getTop( block ) )
		).toBeGreaterThan( 100 );
	}

	async function expectStacked( upper, lower ) {
		await expect
			.poll( async () => {
				const upperBox = await upper.boundingBox();
				const lowerBox = await lower.boundingBox();
				return lowerBox.y - ( upperBox.y + upperBox.height );
			} )
			.toBeGreaterThanOrEqual( 0 );
	}

	test( 'aligns each thread with its block', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'First noted' },
			comment: 'First note',
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: SPACER_TEXT },
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Second noted' },
			comment: 'Second note',
		} );

		const firstThread = getThread( page, 'First note' );
		const secondThread = getThread( page, 'Second note' );
		await expect( firstThread ).toHaveClass( /is-floating/ );
		await expect( secondThread ).toHaveClass( /is-floating/ );

		// Expand the top thread, so the one below stays within the viewport.
		await editor.selectBlocks( getParagraph( editor, 'First noted' ) );
		await expect( firstThread ).toHaveAttribute( 'aria-expanded', 'true' );

		await expectAligned(
			firstThread,
			getParagraph( editor, 'First noted' )
		);
		await expectAligned(
			secondThread,
			getParagraph( editor, 'Second noted' )
		);
	} );

	test( 'anchors the selected thread and stacks its neighbors', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		// Adjacent one-line blocks: their threads are taller than the
		// blocks, so they can't both sit next to their anchors.
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Alpha' },
			comment: 'Alpha note',
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Bravo' },
			comment: 'Bravo note',
		} );

		const alphaThread = getThread( page, 'Alpha note' );
		const bravoThread = getThread( page, 'Bravo note' );

		// The last added note is selected; the one above moves up.
		await expect( bravoThread ).toHaveAttribute( 'aria-expanded', 'true' );
		await expectAligned( bravoThread, getParagraph( editor, 'Bravo' ) );
		await expectStacked( alphaThread, bravoThread );

		// Selecting the other note anchors it instead; the one below moves
		// down.
		await editor.selectBlocks( getParagraph( editor, 'Alpha' ) );
		await expect( alphaThread ).toHaveAttribute( 'aria-expanded', 'true' );
		await expectAligned( alphaThread, getParagraph( editor, 'Alpha' ) );
		await expectStacked( alphaThread, bravoThread );
	} );

	test( 'pushes the next thread down when a thread grows', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Alpha' },
			comment: 'Alpha note',
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Bravo' },
			comment: 'Bravo note',
		} );

		const alphaThread = getThread( page, 'Alpha note' );
		const bravoThread = getThread( page, 'Bravo note' );
		await editor.selectBlocks( getParagraph( editor, 'Alpha' ) );
		await expect( alphaThread ).toHaveAttribute( 'aria-expanded', 'true' );
		await expectStacked( alphaThread, bravoThread );
		const { height: initialHeight } = await alphaThread.boundingBox();

		const replyForm = alphaThread.getByRole( 'textbox', {
			name: 'Reply to',
		} );
		await replyForm.click();
		await replyForm.pressSequentially( 'A reply that makes it taller' );
		await alphaThread
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await expect(
			alphaThread.getByText( 'A reply that makes it taller' )
		).toBeVisible();

		await expect
			.poll( async () => ( await alphaThread.boundingBox() ).height )
			.toBeGreaterThan( initialHeight );
		await expectAligned( alphaThread, getParagraph( editor, 'Alpha' ) );
		await expectStacked( alphaThread, bravoThread );
	} );

	test( 'follows its block when blocks are reordered', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Noted' },
			comment: 'Moving note',
		} );
		// Same height as the noted block, so swapping them resizes nothing.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Other' },
		} );

		const thread = getThread( page, 'Moving note' );
		const noted = getParagraph( editor, 'Noted' );
		await expectAligned( thread, noted );
		const { y: initialTop } = await noted.boundingBox();

		await editor.selectBlocks( noted );
		await editor.clickBlockToolbarButton( 'Move down' );

		await expect
			.poll( async () => ( await noted.boundingBox() ).y )
			.toBeGreaterThan( initialTop );
		await expectAligned( thread, noted );
	} );

	test.describe( 'Block move animation', () => {
		// Moved blocks animate from their old position with a transform.
		test.use( { reducedMotion: 'no-preference' } );

		test( 'reorders threads when noted blocks swap', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Alpha' },
				comment: 'Alpha note',
			} );
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Bravo' },
				comment: 'Bravo note',
			} );

			const alphaThread = getThread( page, 'Alpha note' );
			const bravoThread = getThread( page, 'Bravo note' );
			const alpha = getParagraph( editor, 'Alpha' );
			const bravo = getParagraph( editor, 'Bravo' );
			await expect( alphaThread ).toHaveClass( /is-floating/ );
			await expect( bravoThread ).toHaveClass( /is-floating/ );
			await editor.selectBlocks( bravo );

			// The top thread aligns with its block; the other stacks below.
			await editor.clickBlockToolbarButton( 'Move up' );
			await expectStacked( bravo, alpha );
			await expectAligned( bravoThread, bravo );
			await expectStacked( bravoThread, alphaThread );

			await editor.clickBlockToolbarButton( 'Move down' );
			await expectStacked( alpha, bravo );
			await expectAligned( alphaThread, alpha );
			await expectStacked( alphaThread, bravoThread );

			await editor.clickBlockToolbarButton( 'Move up' );
			await expectStacked( bravo, alpha );
			await expectAligned( bravoThread, bravo );
			await expectStacked( bravoThread, alphaThread );
		} );
	} );

	test( 'follows its block when content above grows', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Short' },
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Noted' },
			comment: 'Following note',
		} );

		const thread = getThread( page, 'Following note' );
		const noted = getParagraph( editor, 'Noted' );
		await expectAligned( thread, noted );
		const { y: initialTop } = await noted.boundingBox();

		// Grow the block above without changing the block list.
		await page.evaluate( ( content ) => {
			const [ first ] = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( first.clientId, { content } );
		}, SPACER_TEXT );

		await expect
			.poll( async () => ( await noted.boundingBox() ).y )
			.toBeGreaterThan( initialTop + 50 );
		await expectAligned( thread, noted );
	} );

	test( 'follows its block when the title grows', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Noted' },
			comment: 'Title note',
		} );

		const thread = getThread( page, 'Title note' );
		const noted = getParagraph( editor, 'Noted' );
		const title = editor.canvas.getByRole( 'textbox', {
			name: 'Add title',
		} );
		// Focus the title first: deselecting the block collapses the thread,
		// which re-measures on its own.
		await title.click();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
		await expectAligned( thread, noted );
		const { y: initialTop } = await noted.boundingBox();

		// The title sits outside the block list, so the list moves without
		// resizing. A few lines, so the block stays in the viewport.
		await title.fill( 'Lorem ipsum dolor sit amet, consectetur' );

		await expect
			.poll( async () => ( await noted.boundingBox() ).y )
			.toBeGreaterThan( initialTop + 50 );
		await expectAligned( thread, noted );
	} );

	test( 'anchors to a closed Details block', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { summary: 'Summary' },
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'Inside' } },
			],
		} );
		const details = editor.canvas.getByRole( 'document', {
			name: 'Block: Details',
		} );
		// Collapsed content isn't exposed by role, so select it by type.
		await editor.selectBlocks(
			details.locator( '[data-type="core/paragraph"]' )
		);
		await blockNoteUtils.addNote( 'Collapsed note' );

		const thread = getThread( page, 'Collapsed note' );
		const inside = getParagraph( editor, 'Inside' );
		await expectAligned( thread, inside );

		// The hidden block still reports a box below the summary, so aligning
		// to it would fail.
		const summary = details.getByText( 'Summary' );
		await summary.click();
		await expect( details ).not.toHaveAttribute( 'open' );
		await expectAligned( thread, details );

		await summary.click();
		await expect( details ).toHaveAttribute( 'open' );
		await expectAligned( thread, inside );
	} );

	test( 'follows its block when an editor notice shifts the canvas', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Noted' },
			comment: 'Notice note',
		} );

		const thread = getThread( page, 'Notice note' );
		const noted = getParagraph( editor, 'Noted' );
		const notice = page
			.getByRole( 'region', { name: 'Editor content' } )
			.getByText( 'Test notice', { exact: true } );
		await expectAligned( thread, noted );
		const { y: initialTop } = await noted.boundingBox();

		// Moves the canvas without resizing anything inside it.
		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/notices' )
				.createNotice( 'warning', 'Test notice', {
					id: 'floating-notes-notice',
				} )
		);

		await expect( notice ).toBeVisible();
		await expect
			.poll( async () => ( await noted.boundingBox() ).y )
			.toBeGreaterThan( initialTop + 20 );
		await expectAligned( thread, noted );

		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/notices' )
				.removeNotice( 'floating-notes-notice' )
		);

		await expect( notice ).toBeHidden();
		await expectAligned( thread, noted );
	} );

	test( 'follows its block in the tablet preview', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Noted' },
			comment: 'Preview note',
		} );

		const thread = getThread( page, 'Preview note' );
		const noted = getParagraph( editor, 'Noted' );
		await expectAligned( thread, noted );
		const { y: initialTop } = await noted.boundingBox();

		// The device preview insets the canvas frame.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).setDeviceType( 'Tablet' )
		);

		await expect
			.poll( async () => ( await noted.boundingBox() ).y )
			.toBeGreaterThan( initialTop + 20 );
		await expectAligned( thread, noted );
	} );

	test( 'keeps threads aligned while the canvas scrolls', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Noted' },
			comment: 'Scrolling note',
		} );
		// Enough content below for the canvas to scroll.
		for ( let i = 0; i < 8; i++ ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: SPACER_TEXT },
			} );
		}

		const thread = getThread( page, 'Scrolling note' );
		const noted = getParagraph( editor, 'Noted' );
		const scrollCanvasTo = ( top ) =>
			editor.canvas
				.locator( 'html' )
				.evaluate( ( el, value ) => el.scrollTo( 0, value ), top );

		await scrollCanvasTo( 0 );
		await expectAligned( thread, noted );
		const { y: initialTop } = await noted.boundingBox();

		await scrollCanvasTo( 150 );

		await expect
			.poll( async () => ( await noted.boundingBox() ).y )
			.toBeLessThan( initialTop - 100 );
		await expectAligned( thread, noted );
	} );

	// A selected thread that extends below the fold is scrolled into view,
	// which scrolls the floating panel and shifts every thread off its anchor.
	test.fixme( 'keeps a selected thread aligned when it extends below the fold', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: SPACER_TEXT.repeat( 2 ) },
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Noted' },
			comment: 'Low note',
		} );

		const thread = getThread( page, 'Low note' );
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
		await expectAligned( thread, getParagraph( editor, 'Noted' ) );
	} );

	test( 'pushes earlier threads above the canvas to keep the selected one aligned', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		// Long notes keep collapsed threads tall, so the stack overflows the
		// space above the selected one.
		const labels = [ 'One', 'Two', 'Three', 'Four' ];
		for ( const label of labels ) {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: label },
				comment: `${ label }: ${ LONG_NOTE }`,
			} );
		}

		const threads = labels.map( ( label ) => getThread( page, label ) );
		const selected = threads.at( -1 );
		await expect( selected ).toHaveAttribute( 'aria-expanded', 'true' );
		await expectAligned( selected, getParagraph( editor, 'Four' ) );
		for ( let i = 1; i < threads.length; i++ ) {
			await expectStacked( threads[ i - 1 ], threads[ i ] );
		}

		const canvasBox = await editor.canvas.owner().boundingBox();
		await expect
			.poll( async () => ( await threads[ 0 ].boundingBox() ).y )
			.toBeLessThan( canvasBox.y );
	} );

	test( 'realigns threads after a tall thread collapses', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Alpha' },
			comment: 'Alpha note',
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: SPACER_TEXT },
		} );
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: `Tall block. ${ SPACER_TEXT }` },
			comment: 'Tall note',
		} );
		for ( let i = 1; i <= REPLY_COUNT; i++ ) {
			await blockNoteUtils.addReply( `Reply ${ i }` );
		}

		// Deselect the note, collapsing the tall thread.
		const tallThread = getThread( page, 'Tall note' );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.focus();
		await expect( tallThread ).toHaveAttribute( 'aria-expanded', 'false' );

		await expectAligned(
			getThread( page, 'Alpha note' ),
			getParagraph( editor, 'Alpha' )
		);
		await expectAligned( tallThread, getParagraph( editor, 'Tall block' ) );
	} );

	test.describe( 'Tall threads', () => {
		// Short enough that a few replies exceed the thread's height cap.
		test.use( { viewport: { width: 1280, height: 600 } } );

		// Allows for sub-pixel rounding at the viewport edge.
		const FULLY_VISIBLE = 0.99;

		async function addTallThread( { blockNoteUtils } ) {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Alpha' },
				comment: 'Tall note',
			} );
			for ( let i = 1; i <= REPLY_COUNT; i++ ) {
				await blockNoteUtils.addReply( `Reply ${ i }` );
			}
		}

		test( 'caps the thread height and keeps the reply form reachable', async ( {
			page,
			blockNoteUtils,
		} ) => {
			// Each reply goes through the reply form, so adding them all
			// already requires reaching it once the thread overflows.
			await addTallThread( { blockNoteUtils } );

			const thread = getThread( page, 'Tall note' );
			await expect( thread ).toBeInViewport( { ratio: FULLY_VISIBLE } );
			expect(
				await thread.evaluate(
					( element ) => element.scrollHeight > element.clientHeight
				)
			).toBe( true );

			const replyForm = thread.getByRole( 'textbox', {
				name: 'Reply to',
			} );
			await replyForm.scrollIntoViewIfNeeded();
			await expect( replyForm ).toBeInViewport();
		} );

		test( 'scrolls the selected thread into view', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await addTallThread( { blockNoteUtils } );

			// Deselect, then select the note again through its block.
			const thread = getThread( page, 'Tall note' );
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.focus();
			await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );
			await editor.selectBlocks( getParagraph( editor, 'Alpha' ) );

			await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
			await expect( thread ).toBeInViewport( { ratio: FULLY_VISIBLE } );
		} );
	} );

	test.describe( 'Inline anchors', () => {
		// Long enough that the trailing word sits well below the block top,
		// so marker alignment is distinguishable from block alignment.
		const LONG_TEXT = SPACER_TEXT + 'The final anchor';

		async function selectTrailingWord( { editor, blockNoteUtils } ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: LONG_TEXT },
			} );
			const paragraph = getParagraph( editor, 'The final anchor' );
			await paragraph.click();
			await blockNoteUtils.selectBlockText( {
				length: 'anchor'.length,
				fromEnd: true,
			} );
			return paragraph;
		}

		// Selection top in page coordinates.
		async function getSelectionTop( editor ) {
			const frameBox = await editor.canvas.owner().boundingBox();
			const top = await editor.canvas.locator( 'body' ).evaluate( () => {
				const selection = window.getSelection();
				return selection.rangeCount
					? selection.getRangeAt( 0 ).getBoundingClientRect().top
					: null;
			} );
			if ( top === null ) {
				throw new Error( 'The canvas has no text selection.' );
			}
			return frameBox.y + top;
		}

		test( 'aligns the floating thread with its inline marker', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			const paragraph = await selectTrailingWord( {
				editor,
				blockNoteUtils,
			} );
			await blockNoteUtils.addNote( 'Align me' );

			const mark = editor.canvas.locator( 'mark.wp-note' );
			await expect( mark ).toHaveText( 'anchor' );
			await expectBelow( mark, paragraph );

			const thread = getThread( page, 'Align me' );
			await expect( thread ).toHaveClass( /is-floating/ );
			await expectAligned( thread, mark );
		} );

		test( 'aligns the pending new-note form with the text selection', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			const paragraph = await selectTrailingWord( {
				editor,
				blockNoteUtils,
			} );
			await editor.clickBlockOptionsMenuItem( 'Add note' );

			// There is no marker yet, so the form anchors to the selection the
			// note will attach to. The canvas keeps it while the form has focus.
			const form = getSidebar( page ).getByRole( 'treeitem', {
				name: 'New note',
				exact: true,
			} );
			await expect( form ).toHaveClass( /is-floating/ );
			await expectBelow( () => getSelectionTop( editor ), paragraph );
			await expectAligned( form, () => getSelectionTop( editor ) );
		} );
	} );
} );

/**
 * The floating notes panel should behave as part of the canvas surface
 * rather than as a layout-occupying sidebar. See #73917 and the design
 * discussion in #66377 / #77484.
 */
test.describe( 'Block Notes: floating panel', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	async function addNote( page, editor, comment ) {
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( comment );
		await page
			.getByRole( 'region', { name: /Notes|Editor settings/ } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		await expect(
			page
				.getByRole( 'region', { name: /Notes|Editor settings/ } )
				.getByRole( 'treeitem', { name: `Note: ${ comment }` } )
		).toBeVisible();
	}

	test( 'notices span the full width of the editor when notes are visible', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Layout test note' );

		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/notices' )
				.createNotice( 'info', 'Full width notice test', {
					isDismissible: true,
				} );
		} );

		const notice = page
			.locator( '.components-notice' )
			.filter( { hasText: 'Full width notice test' } );
		await expect( notice ).toBeVisible();

		const noticeBox = await notice.boundingBox();
		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		const notesBox = await page
			.locator( '.editor-collab-sidebar, .editor-collab-sidebar-overlay' )
			.boundingBox();

		// The notice must reach (nearly) the right edge of the visual canvas
		// surface: the canvas itself plus any notes area painted beside it.
		// A notes column outside the canvas leaves a ~280px gap; allow a
		// generous tolerance for scrollbars and padding.
		const surfaceRight = Math.max(
			canvasBox.x + canvasBox.width,
			notesBox.x + notesBox.width
		);
		expect( surfaceRight - ( noticeBox.x + noticeBox.width ) ).toBeLessThan(
			40
		);
	} );

	test( 'canvas iframe spans the full editor width when notes are visible', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Canvas width note' );

		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		const contentBox = await page
			.locator( '.interface-interface-skeleton__content' )
			.boundingBox();
		const notesBox = await page
			.locator( '.editor-collab-sidebar, .editor-collab-sidebar-overlay' )
			.boundingBox();

		// The canvas (and therefore its scrollbar) must reach the right
		// edge of the editor content area instead of stopping at a notes
		// column, and the notes must overlay the canvas, not sit beside it.
		expect(
			contentBox.x + contentBox.width - ( canvasBox.x + canvasBox.width )
		).toBeLessThan( 5 );
		expect( notesBox.x ).toBeGreaterThanOrEqual( canvasBox.x );
		expect( notesBox.x + notesBox.width ).toBeLessThanOrEqual(
			canvasBox.x + canvasBox.width + 1
		);
	} );

	test( 'floating notes do not overlap full-width content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/cover',
			attributes: {
				align: 'full',
				customOverlayColor: '#111111',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Full width cover' },
				},
			],
		} );
		// Select the cover block (parent of the selected paragraph).
		await page.keyboard.press( 'Escape' );
		await editor.canvas
			.locator( '[data-type="core/cover"]' )
			.first()
			.click( { position: { x: 10, y: 10 } } );
		await addNote( page, editor, 'Cover note' );

		await expect(
			page
				.getByRole( 'region', { name: 'Notes' } )
				.getByRole( 'treeitem', { name: 'Note: Cover note' } )
		).toBeVisible();

		// The full-width block must not render (or hit-test) inside the
		// space reserved for the notes; probe a point inside that area at
		// the cover's vertical center.
		const coverBox = await editor.canvas
			.locator( '[data-type="core/cover"]' )
			.first()
			.boundingBox();
		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		const probe = {
			// Canvas-local coordinates, 100px inside the reserved area.
			x: canvasBox.width - 100,
			y: coverBox.y - canvasBox.y + coverBox.height / 2,
		};
		const hitsCover = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body, point ) => {
				const el = body.ownerDocument.elementFromPoint(
					point.x,
					point.y
				);
				return !! el?.closest( '[data-type="core/cover"]' );
			}, probe );
		expect( hitsCover ).toBe( false );
	} );

	test( 'a thin divider marks the boundary of the reserved notes space', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Divider note' );

		await expect(
			page
				.getByRole( 'region', { name: 'Notes' } )
				.getByRole( 'treeitem', { name: 'Note: Divider note' } )
		).toBeVisible();

		// The divider is a `:root::after` pseudo-element inside the canvas
		// (the body's overflow clip would cut a body-attached line short),
		// occupying the outermost pixel of the reserved space so clipped
		// full-bleed content meets it without covering it. Its color derives
		// from `currentColor`.
		const divider = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body ) => {
				const view = body.ownerDocument.defaultView;
				const root = body.ownerDocument.documentElement;
				const style = view.getComputedStyle( root, '::after' );
				const reservedWidth = parseFloat(
					view.getComputedStyle( root ).paddingInlineEnd
				);
				return {
					position: style.position,
					insetInlineEnd: parseFloat( style.insetInlineEnd ),
					width: parseFloat( style.width ),
					height: parseFloat( style.height ),
					background: style.backgroundColor,
					reservedWidth,
					viewportHeight: view.innerHeight,
				};
			} );

		expect( divider.position ).toBe( 'fixed' );
		expect( divider.width ).toBe( 1 );
		// The divider's far edge lands exactly on the content boundary: flush
		// with full-bleed content clipped there, with no gap and no overlap.
		expect( divider.insetInlineEnd + divider.width ).toBe(
			divider.reservedWidth
		);
		// Spans the visible canvas top to bottom.
		expect( divider.height ).toBe( divider.viewportHeight );
		// Semi-transparent, derived from the canvas text color.
		expect( divider.background ).toMatch( /rgba\(|color\(|color-mix\(/ );
	} );

	test( 'floating note is centered in the space reserved beside full-width content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/cover',
			attributes: {
				align: 'full',
				customOverlayColor: '#111111',
				minHeight: 2000,
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Full width cover' },
				},
			],
		} );
		// Select the cover block (parent of the selected paragraph).
		await page.keyboard.press( 'Escape' );
		await editor.canvas
			.locator( '[data-type="core/cover"]' )
			.first()
			.click( { position: { x: 10, y: 10 } } );
		await addNote( page, editor, 'Centered note' );

		const thread = page.locator( '.editor-collab-sidebar-panel__thread' );
		await expect( thread ).toBeVisible();

		const threadBox = await thread.boundingBox();
		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		// The reserved space is the padding applied to the canvas root. It ends
		// where the scrollbar begins (the content edge), inset from the window
		// edge by the scrollbar width; a tall cover forces the scrollbar so this
		// exercises the scrollbar-width offset. Measuring the reserved padding
		// directly is robust: the full-bleed cover's own box escapes the padding
		// with negative margins and is only clipped visually, so its reported
		// box can't delimit the gap.
		const { contentEdge, reservedWidth } = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body ) => {
				const doc = body.ownerDocument;
				const root = doc.documentElement;
				return {
					contentEdge: root.clientWidth,
					reservedWidth: parseFloat(
						doc.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					),
				};
			} );

		const gapEnd = canvasBox.x + contentEdge;
		const gapStart = gapEnd - reservedWidth;
		const leftMargin = threadBox.x - gapStart;
		const rightMargin = gapEnd - ( threadBox.x + threadBox.width );

		// The note must sit inside the reserved space with balanced margins,
		// not tucked against the scrollbar. Before the fix the overlay was
		// shifted out by the scrollbar width (~31px/1px left/right on Linux).
		expect( leftMargin ).toBeGreaterThan( 0 );
		expect( rightMargin ).toBeGreaterThan( 0 );
		expect( Math.abs( leftMargin - rightMargin ) ).toBeLessThan( 4 );
	} );

	test( 'floating notes remain visible when the Settings sidebar is open', async ( {
		editor,
		page,
	} ) => {
		await page.setViewportSize( { width: 1400, height: 800 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Coexistence note' );

		await editor.openDocumentSettingsSidebar();
		await expect(
			page.getByRole( 'region', { name: 'Editor settings' } )
		).toBeVisible();
		await expect(
			page
				.getByRole( 'region', { name: 'Notes' } )
				.getByRole( 'treeitem', { name: 'Note: Coexistence note' } )
		).toBeVisible();
	} );

	test( 'opening the All notes sidebar hides the floating notes panel', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Archive note' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } )
			.click();

		await expect(
			page.getByRole( 'region', { name: 'Notes' } )
		).toBeHidden();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Archive note' } )
		).toBeVisible();
	} );

	test( 'floating notes panel is not rendered on small viewports', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Small viewport note' );

		await page.setViewportSize( { width: 600, height: 800 } );
		await expect(
			page.getByRole( 'region', { name: 'Notes' } )
		).toBeHidden();
	} );

	test( 'floating notes yield when the canvas is too narrow', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Narrow canvas note' );

		const notes = page.getByRole( 'region', { name: 'Notes' } );

		// Reading the reserved padding applied to the canvas root.
		const getReservedWidth = () =>
			editor.canvas.locator( 'body' ).evaluate( ( body ) => {
				const root = body.ownerDocument.documentElement;
				return (
					parseFloat(
						body.ownerDocument.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					) || 0
				);
			} );

		// The Settings sidebar narrows the canvas without touching the admin
		// viewport, which stays above the large-viewport breakpoint - so only
		// the canvas-width guard (not the viewport gate) governs the panel.
		await editor.openDocumentSettingsSidebar();
		await page.setViewportSize( { width: 1200, height: 800 } );
		await expect( notes ).toBeVisible();
		expect( await getReservedWidth() ).toBeGreaterThan( 0 );

		// Shrink the window so the canvas (minus the sidebar) is narrower than
		// the panel needs, while the viewport itself stays "large".
		await page.setViewportSize( { width: 800, height: 800 } );

		// The floating panel yields and releases the reserved canvas padding so
		// it doesn't crowd the narrow content column.
		await expect( notes ).toBeHidden();
		expect( await getReservedWidth() ).toBe( 0 );

		// Widening the canvas again brings the panel (and reserved space) back.
		await page.setViewportSize( { width: 1200, height: 800 } );
		await expect( notes ).toBeVisible();
		expect( await getReservedWidth() ).toBeGreaterThan( 0 );
	} );

	test( 'adding a note on a canvas too narrow for floating notes opens All notes', async ( {
		editor,
		page,
	} ) => {
		// The admin viewport stays above the large-viewport breakpoint, but
		// the Settings sidebar leaves the canvas narrower than the floating
		// panel needs, so the floating panel can't show the new-note form.
		await page.setViewportSize( { width: 800, height: 800 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph without notes' },
		} );
		await editor.openDocumentSettingsSidebar();

		await editor.clickBlockOptionsMenuItem( 'Add note' );

		const input = page.getByRole( 'textbox', {
			name: 'New note',
			exact: true,
		} );
		await expect( input ).toBeVisible();
		await expect( input ).toBeFocused();
		await expect(
			page.getByRole( 'region', { name: 'Notes' } )
		).toBeHidden();
	} );

	test( 'floating note is centered in the reserved space of a canvas narrower than the editor', async ( {
		editor,
		page,
	} ) => {
		await page.setViewportSize( { width: 1600, height: 900 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Resized canvas note' );

		const settingsToggle = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Settings', exact: true } );
		if (
			( await settingsToggle.getAttribute( 'aria-expanded' ) ) === 'true'
		) {
			await settingsToggle.click();
		}

		// The tablet preview gives the canvas an explicit width and enables
		// the resize handles. Widening it past the tablet breakpoint makes it
		// a Desktop canvas again, still narrower than (and centered in) the
		// editor, so its edge no longer matches the editor edge.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'View', exact: true } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Tablet' } ).click();
		await page.keyboard.press( 'Escape' );

		const handle = page
			.getByRole( 'separator', { name: 'Drag to resize' } )
			.first();
		const handleBox = await handle.boundingBox();
		const x = handleBox.x + handleBox.width / 2;
		const y = handleBox.y + handleBox.height / 2;
		await page.mouse.move( x, y );
		await page.mouse.down();
		// The handle resizes at double the pointer distance (the canvas is
		// centered), so this widens the canvas by 360px.
		await page.mouse.move( x - 180, y, { steps: 10 } );
		await page.mouse.up();

		const canvas = page.locator( 'iframe[name="editor-canvas"]' );
		const getReservedWidth = () =>
			editor.canvas.locator( 'body' ).evaluate( ( body ) => {
				const root = body.ownerDocument.documentElement;
				return (
					parseFloat(
						body.ownerDocument.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					) || 0
				);
			} );
		// Space is only reserved for a Desktop canvas.
		await expect.poll( getReservedWidth ).toBe( 280 );
		const editorBox = await page
			.locator( '.editor-visual-editor' )
			.boundingBox();
		const canvasBox = await canvas.boundingBox();
		expect( canvasBox.x + canvasBox.width ).toBeLessThan(
			editorBox.x + editorBox.width - 100
		);

		const thread = page.locator( '.editor-collab-sidebar-panel__thread' );
		await expect( thread ).toBeVisible();
		const contentEdge = await editor.canvas
			.locator( 'body' )
			.evaluate(
				( body ) => body.ownerDocument.documentElement.clientWidth
			);
		const gapEnd = canvasBox.x + contentEdge;
		const gapStart = gapEnd - 280;

		await expect
			.poll( async () => {
				const threadBox = await thread.boundingBox();
				const leftMargin = threadBox.x - gapStart;
				const rightMargin = gapEnd - ( threadBox.x + threadBox.width );
				return (
					leftMargin > 0 &&
					rightMargin > 0 &&
					Math.abs( leftMargin - rightMargin ) < 4
				);
			} )
			.toBe( true );
	} );

	test( 'floating notes do not react to the device preview', async ( {
		editor,
		page,
	} ) => {
		await page.setViewportSize( { width: 1450, height: 800 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Device preview note' );

		const notes = page.getByRole( 'region', { name: 'Notes' } );
		const setDevice = async ( device ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'View', exact: true } )
				.click();
			await page.getByRole( 'menuitemradio', { name: device } ).click();
			// The View menu stays open after choosing a device; close it so
			// the next interaction starts from a closed menu.
			await page.keyboard.press( 'Escape' );
		};

		// Reads the reserved padding applied to the canvas root.
		const getReservedWidth = () =>
			editor.canvas.locator( 'body' ).evaluate( ( body ) => {
				const root = body.ownerDocument.documentElement;
				return (
					parseFloat(
						body.ownerDocument.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					) || 0
				);
			} );

		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 280 );

		// The device preview simulates a device width; the notes are editor
		// chrome, so they must neither hide at the simulated width nor
		// reserve space inside the previewed canvas (which would distort the
		// simulation).
		await setDevice( 'Tablet' );
		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 0 );

		await setDevice( 'Mobile' );
		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 0 );

		// Back to Desktop, the canvas reservation returns.
		await setDevice( 'Desktop' );
		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 280 );
	} );
} );
