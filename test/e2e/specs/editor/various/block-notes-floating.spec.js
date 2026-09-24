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
		return page.getByRole( 'region', { name: 'Editor settings' } );
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
