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

test.describe( 'Block Notes: floating notes', () => {
	// Tall enough that the selected thread in these tests fits within the
	// viewport. One extending below the fold is scrolled into view, which
	// shifts every thread off its anchor (see the `fixme` test below). Wide
	// enough for the canvas margin beside the Settings sidebar.
	test.use( { viewport: { width: 1440, height: 900 } } );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	function getFloatingNotes( page ) {
		return page.getByRole( 'region', { name: 'Notes' } );
	}

	function getAllNotes( page ) {
		return page.getByRole( 'region', { name: 'Editor settings' } );
	}

	function getThread( page, content ) {
		return getFloatingNotes( page ).getByRole( 'treeitem', {
			name: `Note: ${ content }`,
		} );
	}

	// Space reserved for the notes inside the canvas.
	function getReservedWidth( editor ) {
		return editor.canvas
			.locator( ':root' )
			.evaluate( ( root ) =>
				parseFloat(
					root.ownerDocument.defaultView.getComputedStyle( root )
						.paddingInlineEnd
				)
			);
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

	// Distance from a thread to its anchor. Scrolling must not change it.
	async function getOffset( item, anchor ) {
		return ( await getTop( item ) ) - ( await getTop( anchor ) );
	}

	// Aligned, or at a captured offset (a thread pushed off its anchor).
	async function expectAligned(
		item,
		anchor,
		{ offset = 0, tolerance = ALIGN_TOLERANCE } = {}
	) {
		await expect
			.poll( async () =>
				Math.abs( ( await getOffset( item, anchor ) ) - offset )
			)
			.toBeLessThan( tolerance );
	}

	function getCanvasScrollTop( editor ) {
		return editor.canvas
			.locator( 'html' )
			.evaluate( ( root ) => root.scrollTop );
	}

	function scrollCanvasTo( editor, top ) {
		return editor.canvas
			.locator( 'html' )
			.evaluate( ( root, value ) => root.scrollTo( 0, value ), top );
	}

	// Enough content below for the canvas to scroll.
	async function addSpacerParagraphs( editor, count = 8 ) {
		for ( let i = 0; i < count; i++ ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: SPACER_TEXT },
			} );
		}
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
		// A notes column beside the canvas would cut the notice short.
		const noticeBox = await page
			.locator( '.components-notice' )
			.filter( { hasText: 'Test notice' } )
			.boundingBox();
		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		expect(
			canvasBox.x + canvasBox.width - ( noticeBox.x + noticeBox.width )
		).toBeLessThan( 40 );
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
		await addSpacerParagraphs( editor );

		const thread = getThread( page, 'Scrolling note' );
		const noted = getParagraph( editor, 'Noted' );

		await scrollCanvasTo( editor, 0 );
		await expectAligned( thread, noted );
		const { y: initialTop } = await noted.boundingBox();

		await scrollCanvasTo( editor, 150 );

		await expect
			.poll( async () => ( await noted.boundingBox() ).y )
			.toBeLessThan( initialTop - 100 );
		await expectAligned( thread, noted );
	} );

	// Scrolling a selected thread into view scrolls the floating panel, which
	// mirrors the canvas, so every thread keeps its anchor.
	test( 'keeps a selected thread aligned when it extends below the fold', async ( {
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

	test( 'adds no room to a post that already scrolls past its threads', async ( {
		editor,
		page,
		blockNoteUtils,
	} ) => {
		await blockNoteUtils.addBlockWithNote( {
			type: 'core/paragraph',
			attributes: { content: 'Alpha' },
			comment: 'Alpha note',
		} );
		await addSpacerParagraphs( editor );

		const getScrollHeight = () =>
			editor.canvas
				.locator( 'html' )
				.evaluate( ( root ) => root.scrollHeight );
		const thread = getThread( page, 'Alpha note' );
		await editor.selectBlocks( getParagraph( editor, 'Alpha' ) );
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
		const expandedHeight = await getScrollHeight();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.focus();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'false' );

		expect( await getScrollHeight() ).toBe( expandedHeight );
	} );

	// Many notes on a short post overflow the viewport while the content
	// alone gives the canvas nothing to scroll.
	test.describe( 'Short posts', () => {
		test.use( { viewport: { width: 1440, height: 700 } } );

		const LABELS = [
			'Alpha',
			'Bravo',
			'Charlie',
			'Delta',
			'Echo',
			'Foxtrot',
			'Golf',
			'Hotel',
		];

		// Where the last thread sits below its paragraph before the test
		// scrolls. Only the first thread is anchored; the rest stack below it.
		let lastOffset;

		// Adds the notes, then collapses the last one and scrolls back up.
		test.beforeEach( async ( { editor, page, blockNoteUtils } ) => {
			for ( const label of LABELS ) {
				await blockNoteUtils.addBlockWithNote( {
					type: 'core/paragraph',
					attributes: { content: label },
					comment: `${ label } note`,
				} );
			}
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.focus();
			await expect( getThread( page, 'Hotel note' ) ).toHaveAttribute(
				'aria-expanded',
				'false'
			);
			await scrollCanvasTo( editor, 0 );
			lastOffset = await getOffset(
				getThread( page, 'Hotel note' ),
				getParagraph( editor, 'Hotel' )
			);
		} );

		// The threads moved with the canvas: the anchored one still lines up
		// with its paragraph, and a stacked one kept its distance.
		async function expectStackFollowed( { editor, page } ) {
			await expectAligned(
				getThread( page, 'Alpha note' ),
				getParagraph( editor, 'Alpha' )
			);
			await expectAligned(
				getThread( page, 'Hotel note' ),
				getParagraph( editor, 'Hotel' ),
				{ offset: lastOffset, tolerance: 2 }
			);
		}

		test( 'reaches the last thread by scrolling beside the threads', async ( {
			editor,
			page,
		} ) => {
			const lastThread = getThread( page, 'Hotel note' );
			await expect( lastThread ).not.toBeInViewport();

			// The strip left of the threads passes the wheel to the canvas.
			const region = await getFloatingNotes( page ).boundingBox();
			await page.mouse.move( region.x + 6, region.y + region.height / 2 );
			await page.mouse.wheel( 0, 2000 );

			await expect( lastThread ).toBeInViewport( { ratio: 1 } );
			await expectStackFollowed( { editor, page } );
		} );

		test( 'scrolls the canvas with the wheel over a thread', async ( {
			editor,
			page,
		} ) => {
			await getThread( page, 'Alpha note' ).hover();
			await page.mouse.wheel( 0, 200 );

			await expect
				.poll( () => getCanvasScrollTop( editor ) )
				.toBeGreaterThan( 100 );
			await expectStackFollowed( { editor, page } );
		} );

		test( 'scrolls the canvas to a thread focused by keyboard', async ( {
			editor,
			page,
		} ) => {
			const lastThread = getThread( page, 'Hotel note' );
			await getThread( page, 'Alpha note' ).focus();
			await expect( lastThread ).not.toBeInViewport();

			await page.keyboard.press( 'End' );

			await expect( lastThread ).toBeFocused();
			await expect( lastThread ).toBeInViewport( { ratio: 1 } );
			await expect
				.poll( () => getCanvasScrollTop( editor ) )
				.toBeGreaterThan( 100 );
			await expectStackFollowed( { editor, page } );
		} );
	} );

	test.describe( 'Tall threads', () => {
		// Short enough that a few replies exceed the thread's height cap.
		test.use( { viewport: { width: 1440, height: 600 } } );

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

		test( 'scrolls the thread before the canvas', async ( {
			browserName,
			editor,
			page,
			blockNoteUtils,
		} ) => {
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip(
				browserName === 'firefox',
				'Firefox keeps a wheel gesture on the scroller it started in.'
			);

			await addTallThread( { blockNoteUtils } );

			// Adding the replies scrolled the thread to its reply form.
			const thread = getThread( page, 'Tall note' );
			await thread.evaluate( ( element ) => {
				element.scrollTop = 0;
			} );
			const getThreadScrollTop = () =>
				thread.evaluate( ( element ) => element.scrollTop );

			await thread.hover();
			const canvasScrollTop = await getCanvasScrollTop( editor );
			await page.mouse.wheel( 0, 100 );
			await expect.poll( getThreadScrollTop ).toBeGreaterThan( 50 );
			expect( await getCanvasScrollTop( editor ) ).toBe(
				canvasScrollTop
			);

			// Past the thread's end, the wheel reaches the canvas.
			await expect
				.poll( async () => {
					await page.mouse.wheel( 0, 400 );
					return getCanvasScrollTop( editor );
				} )
				.toBeGreaterThan( canvasScrollTop );
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
			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();

			// There is no marker yet, so the form anchors to the selection the
			// note will attach to. The canvas keeps it while the form has focus.
			const form = getFloatingNotes( page ).getByRole( 'treeitem', {
				name: 'New note',
				exact: true,
			} );
			await expect( form ).toHaveClass( /is-floating/ );
			await expectBelow( () => getSelectionTop( editor ), paragraph );
			await expectAligned( form, () => getSelectionTop( editor ) );
		} );
	} );

	test.describe( 'Multiple notes per block', () => {
		test( 'resolving one note does not affect sibling notes on the same block', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block with notes to resolve' },
				comment: 'Note A',
			} );
			await blockNoteUtils.addNote( 'Note B' );

			const notes = getFloatingNotes( page );

			// Resolve Note A.
			const threadA = notes.getByRole( 'treeitem', {
				name: 'Note: Note A',
			} );
			await threadA.click();
			await page.getByRole( 'button', { name: 'Resolve' } ).click();
			// Resolving removes the note from the floating "Unresolved notes"
			// view, which confirms the action completed.
			await expect( threadA ).toBeHidden();

			// Note B should still be visible and unresolved (expanded).
			const threadB = notes.getByRole( 'treeitem', {
				name: 'Note: Note B',
			} );
			await expect( threadB ).toBeVisible();

			// Both notes should still exist in metadata.
			const blocks = await editor.getBlocks();
			const paragraphBlock = blocks.find(
				( b ) => b.name === 'core/paragraph'
			);
			const noteIds = paragraphBlock?.attributes?.metadata?.noteId;
			expect( noteIds ).toHaveLength( 2 );
		} );

		test( 'auto-selects first unresolved note when clicking a block with multiple notes', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Block for auto-select' },
				comment: 'First note',
			} );
			await blockNoteUtils.addNote( 'Second note' );

			const notes = getFloatingNotes( page );

			// Resolve the first note.
			const firstThread = notes.getByRole( 'treeitem', {
				name: 'Note: First note',
			} );
			await firstThread.click();
			await page.getByRole( 'button', { name: 'Resolve' } ).click();
			// Resolving removes the note from the floating "Unresolved notes"
			// view, which confirms the action completed.
			await expect( firstThread ).toBeHidden();

			// Click the title to deselect the block and its comment.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.focus();

			// Click back on the original block.
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Block for auto-select' } )
				.click();

			// The second (unresolved) note should be the active one.
			const secondThread = notes.getByRole( 'treeitem', {
				name: 'Note: Second note',
			} );
			await expect( secondThread ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
		} );
	} );

	test.describe( 'Canvas margin', () => {
		function getCanvasFrame( page ) {
			return page.locator( 'iframe[name="editor-canvas"]' );
		}

		function getEditorContent( page ) {
			return page.getByRole( 'region', { name: 'Editor content' } );
		}

		test( 'overlays the canvas, which spans the editor content', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Noted' },
				comment: 'Layout note',
			} );

			const canvasBox = await getCanvasFrame( page ).boundingBox();
			const contentBox = await getEditorContent( page ).boundingBox();
			const notesBox = await getFloatingNotes( page ).boundingBox();
			const canvasRight = canvasBox.x + canvasBox.width;

			expect( canvasRight ).toBeCloseTo(
				contentBox.x + contentBox.width,
				0
			);
			expect( notesBox.x ).toBeGreaterThanOrEqual( canvasBox.x );
			expect( notesBox.x + notesBox.width ).toBeCloseTo( canvasRight, 0 );
		} );

		test( 'keeps full-width content out of the reserved space', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/cover',
				attributes: { align: 'full', customOverlayColor: '#111111' },
				comment: 'Cover note',
			} );

			const cover = editor.canvas.getByRole( 'document', {
				name: 'Block: Cover',
			} );
			const coverBox = await cover.boundingBox();
			const canvasBox = await getCanvasFrame( page ).boundingBox();
			// A point 100px inside the reserved space, level with the cover.
			const hitsCover = await cover.evaluate(
				( element, point ) =>
					element.contains(
						element.ownerDocument.elementFromPoint(
							point.x,
							point.y
						)
					),
				{
					x: canvasBox.width - 100,
					y: coverBox.y - canvasBox.y + coverBox.height / 2,
				}
			);
			expect( hitsCover ).toBe( false );
		} );

		test( 'minimizes the notes when the canvas is narrow', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Noted' },
				comment: 'Narrow canvas note',
			} );
			await editor.openDocumentSettingsSidebar();
			const thread = getThread( page, 'Narrow canvas note' );
			const content = thread.getByText( 'Narrow canvas note' );
			// Deselect the new note, so it can minimize.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();
			await expect( content ).toBeVisible();
			await expect.poll( () => getReservedWidth( editor ) ).toBe( 280 );

			// The viewport stays large; the sidebar leaves a narrow canvas.
			await page.setViewportSize( { width: 1100, height: 900 } );
			await expect( thread ).toBeVisible();
			await expect( content ).toBeHidden();
			await expect.poll( () => getReservedWidth( editor ) ).toBe( 82 );
		} );

		test( 'yields to All notes when the canvas is too narrow', async ( {
			editor,
			page,
		} ) => {
			await page.setViewportSize( { width: 900, height: 900 } );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Noted' },
			} );
			await editor.openDocumentSettingsSidebar();
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Document Overview' } )
				.click();

			await editor.clickBlockOptionsMenuItem( 'Add note' );

			await expect(
				getAllNotes( page ).getByRole( 'textbox', {
					name: 'New note',
					exact: true,
				} )
			).toBeFocused();
			await expect( getFloatingNotes( page ) ).toBeHidden();
		} );

		test( 'hides the notes in device preview and opens All notes to add a note', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Noted' },
				comment: 'Device preview note',
			} );
			await page.evaluate( () =>
				window.wp.data
					.dispatch( 'core/editor' )
					.setDeviceType( 'Tablet' )
			);

			await expect(
				getThread( page, 'Device preview note' )
			).toBeHidden();
			await expect.poll( () => getReservedWidth( editor ) ).toBe( 0 );

			await editor.clickBlockOptionsMenuItem( 'Add note' );
			await expect(
				getAllNotes( page ).getByRole( 'textbox', {
					name: 'New note',
					exact: true,
				} )
			).toBeFocused();
		} );

		test.describe( 'Zoom out', () => {
			test.beforeAll( async ( { requestUtils } ) => {
				await requestUtils.activateTheme( 'twentytwentyfive' );
			} );

			test.afterAll( async ( { requestUtils } ) => {
				await requestUtils.activateTheme( 'twentytwentyone' );
			} );

			test( 'hides the notes and opens All notes to add a note', async ( {
				editor,
				page,
				blockNoteUtils,
			} ) => {
				await blockNoteUtils.addBlockWithNote( {
					type: 'core/paragraph',
					attributes: { content: 'Noted' },
					comment: 'Zoom out note',
				} );
				// Zoom out needs the template shown.
				await page.evaluate( () =>
					window.wp.data
						.dispatch( 'core/editor' )
						.setRenderingMode( 'template-locked' )
				);
				await page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Zoom Out' } )
					.click();

				await expect( getThread( page, 'Zoom out note' ) ).toBeHidden();
				await expect.poll( () => getReservedWidth( editor ) ).toBe( 0 );

				await editor.clickBlockOptionsMenuItem( 'Add note' );
				await expect(
					getAllNotes( page ).getByRole( 'textbox', {
						name: 'New note',
						exact: true,
					} )
				).toBeFocused();
			} );
		} );
	} );

	test.describe( 'Display mode', () => {
		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.resetPreferences();
		} );

		test( 'hides and shows floating notes', async ( {
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block notes' },
				comment: 'A floating note',
			} );
			const thread = getThread( page, 'A floating note' );

			await blockNoteUtils.clickNotesMenuItem( 'Hide notes' );
			await expect( thread ).toBeHidden();

			await blockNoteUtils.clickNotesMenuItem( 'Expand notes' );
			await expect( thread ).toBeVisible();

			// Floating notes yield to "All notes".
			await blockNoteUtils.clickNotesMenuItem( 'Show all notes' );
			await expect(
				getAllNotes( page ).getByRole( 'heading', {
					name: 'All notes',
				} )
			).toBeVisible();
			await expect( getFloatingNotes( page ) ).toBeHidden();

			// Showing notes closes "All notes".
			await blockNoteUtils.clickNotesMenuItem( 'Expand notes' );
			await expect( thread ).toBeVisible();
			await expect(
				getAllNotes( page ).getByRole( 'heading', {
					name: 'All notes',
				} )
			).toBeHidden();
		} );

		test( 'minimizes floating notes', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block notes' },
				comment: 'A minimized note',
			} );
			const thread = getThread( page, 'A minimized note' );
			const content = thread.getByText( 'A minimized note' );

			await blockNoteUtils.clickNotesMenuItem( 'Minimize notes' );
			// Deselect the new note, so it minimizes.
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.click();
			await expect( thread ).toBeVisible();
			await expect( content ).toBeHidden();
			await expect.poll( () => getReservedWidth( editor ) ).toBe( 82 );

			// Selecting the block highlights the thread without expanding it.
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.click();
			await expect( thread ).toHaveClass( /is-selected/ );
			await expect( content ).toBeHidden();

			// The focused thread expands.
			await thread.click();
			await expect( content ).toBeVisible();
		} );

		test( 'reflects the room for notes in the menu', async ( {
			editor,
			page,
			blockNoteUtils,
			pageUtils,
		} ) => {
			await blockNoteUtils.addBlockWithNote( {
				type: 'core/paragraph',
				attributes: { content: 'Testing block notes' },
				comment: 'A roomy note',
			} );
			await editor.openDocumentSettingsSidebar();
			// Open by keyboard: resizing moves the menu, and a pointer left
			// outside the submenu would close it.
			await page.mouse.move( 0, 0 );
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } )
				.focus();
			await page.keyboard.press( 'Enter' );
			await page
				.getByRole( 'menuitem', { name: 'Notes', exact: true } )
				.focus();
			await page.keyboard.press( 'ArrowRight' );
			const expand = page.getByRole( 'menuitemradio', {
				name: 'Expand notes',
			} );
			const minimize = page.getByRole( 'menuitemradio', {
				name: 'Minimize notes',
			} );
			await expect( expand ).toBeEnabled();
			await expect( expand ).toBeChecked();

			// The menu follows the window while it's open.
			await page.setViewportSize( { width: 1100, height: 900 } );
			await expect( expand ).toBeDisabled();
			await expect( expand ).toHaveAccessibleDescription(
				'Not enough space.'
			);
			await expect( minimize ).toBeChecked();

			await page.setViewportSize( { width: 1440, height: 900 } );
			await expect( expand ).toBeEnabled();
			await expect( expand ).toBeChecked();

			// And the canvas, when a shortcut closes a sidebar.
			await page.setViewportSize( { width: 1100, height: 900 } );
			await expect( expand ).toBeDisabled();
			await pageUtils.pressKeys( 'primaryShift+,' );
			await expect( expand ).toBeEnabled();
		} );

		test( 'shows hidden notes when adding a note', async ( {
			editor,
			page,
			blockNoteUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Testing block notes' },
			} );
			await blockNoteUtils.clickNotesMenuItem( 'Hide notes' );

			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Add note', exact: true } )
				.click();
			await expect(
				page.getByRole( 'textbox', { name: 'New note', exact: true } )
			).toBeFocused();
			await expect(
				getFloatingNotes( page ).getByRole( 'treeitem', {
					name: 'New note',
					exact: true,
				} )
			).toBeVisible();
		} );
	} );
} );
