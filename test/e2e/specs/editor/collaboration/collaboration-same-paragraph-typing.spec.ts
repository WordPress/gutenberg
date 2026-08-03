/**
 * External dependencies
 */
import type { Locator, Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { pressKey, LINE_START_KEY } from './fixtures/keyboard-utils';

// Distinct alphabets so any interleaving or reordering is easy to spot.
const USER_A_TEXT = 'abcdefghijklmnopqrstuvwxyz0123456789';
const USER_B_TEXT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9876543210';

// Delay between keystrokes, in milliseconds. Approximates fast typing.
const TYPING_DELAY = 30;

// CPU throttling factor applied while both users type concurrently.
// Approximates mid-range consumer hardware; an unthrottled dev machine
// renders remote updates so fast that the editor-DOM-lags-the-Y.Doc
// window almost never overlaps a keystroke.
const CPU_THROTTLE_RATE = 4;

// "User A: " = 8 characters; the caret goes right before the first "|".
const INITIAL_CONTENT = 'User A: | User B: |';
const USER_A_CARET_OFFSET = 8;
// "User A: | User B: " = 18 characters; right before the second "|".
const USER_B_CARET_OFFSET = 18;

const EXPECTED_CONTENT = `User A: ${ USER_A_TEXT }| User B: ${ USER_B_TEXT }|`;

/**
 * Set the Chrome CPU throttling rate for a page. The CDP session is kept
 * open because throttling reverts when the session that set it detaches.
 *
 * @param page The page to throttle.
 * @param rate Throttling factor (1 = no throttling).
 * @return A function that restores normal CPU speed.
 */
async function setCpuThrottling(
	page: Page,
	rate: number
): Promise< () => Promise< void > > {
	const client = await page.context().newCDPSession( page );
	await client.send( 'Emulation.setCPUThrottlingRate', { rate } );

	return async () => {
		await client.send( 'Emulation.setCPUThrottlingRate', { rate: 1 } );
		await client.detach();
	};
}

/**
 * Click a paragraph and move the caret to an exact offset using only
 * keyboard navigation, mimicking how a real user would position it.
 *
 * @param page      The user's page.
 * @param paragraph Locator for the paragraph block.
 * @param offset    Rich text offset to place the caret at.
 */
async function placeCaretAtOffset(
	page: Page,
	paragraph: Locator,
	offset: number
) {
	await paragraph.click();
	await page.keyboard.press( LINE_START_KEY );
	await pressKey( page, 'ArrowRight', offset );
}

// Timeline entry recorded on every core/block-editor store change.
interface TimelineEntry {
	t: number;
	so?: number;
	eo?: number;
	cid?: string;
	content: string;
}

/**
 * Install (or reset) a store recorder on the page. Every block-editor store
 * change that alters the selection offsets, selected clientId, or first
 * paragraph content appends a timeline entry to window.__selTimeline.
 *
 * @param page The page to record.
 */
async function installSelectionRecorder( page: Page ): Promise< void > {
	await page.evaluate( () => {
		const w = window as any;
		w.__selTimeline = [];

		if ( w.__selRecorderInstalled ) {
			return;
		}
		w.__selRecorderInstalled = true;

		const t0 = performance.now();
		const store = w.wp.data.select( 'core/block-editor' );

		w.wp.data.subscribe( () => {
			const selectionStart = store.getSelectionStart();
			const selectionEnd = store.getSelectionEnd();
			const blocks = store.getBlocks();
			const content = blocks
				.map( ( block: { attributes: { content?: unknown } } ) =>
					String( block.attributes.content ?? '' )
				)
				.join( '¶' );

			const entry = {
				t: Math.round( performance.now() - t0 ),
				so: selectionStart?.offset,
				eo: selectionEnd?.offset,
				cid: selectionStart?.clientId?.slice( 0, 8 ),
				content,
			};

			const timeline = w.__selTimeline;
			const last = timeline[ timeline.length - 1 ];

			if (
				! last ||
				last.so !== entry.so ||
				last.eo !== entry.eo ||
				last.cid !== entry.cid ||
				last.content !== entry.content
			) {
				timeline.push( entry );
			}
		}, 'core/block-editor' );
	} );
}

async function getSelectionTimeline( page: Page ): Promise< TimelineEntry[] > {
	return page.evaluate( () => ( window as any ).__selTimeline ?? [] );
}

/**
 * Find backward caret jumps in a recorded timeline. In a typing-only
 * workload where all remote edits are inserts, a user's caret offset must
 * never decrease: their own keystrokes advance it and remote inserts before
 * it push it forward. Any decrease means the caret slid back.
 *
 * @param timeline The recorded timeline.
 * @return Pairs of adjacent entries where the caret moved backwards.
 */
function findBackwardCaretJumps(
	timeline: TimelineEntry[]
): Array< { from: TimelineEntry; to: TimelineEntry } > {
	const jumps: Array< { from: TimelineEntry; to: TimelineEntry } > = [];

	for ( let i = 1; i < timeline.length; i++ ) {
		const prev = timeline[ i - 1 ];
		const next = timeline[ i ];

		if (
			'number' === typeof prev.so &&
			'number' === typeof next.so &&
			next.so < prev.so
		) {
			jumps.push( { from: prev, to: next } );
		}
	}

	return jumps;
}

async function getParagraphContents( page: Page ): Promise< string[] > {
	return page.evaluate( () =>
		( window as any ).wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map( ( block: { attributes: { content?: unknown } } ) =>
				String( block.attributes.content ?? '' )
			)
	);
}

async function getSelectionOffsets(
	page: Page
): Promise< { start?: number; end?: number } > {
	return page.evaluate( () => ( {
		start: ( window as any ).wp.data
			.select( 'core/block-editor' )
			.getSelectionStart()?.offset,
		end: ( window as any ).wp.data
			.select( 'core/block-editor' )
			.getSelectionEnd()?.offset,
	} ) );
}

test.describe( 'Collaboration - Same Paragraph Concurrent Typing', () => {
	// Models the real-world scenario: the paragraph content is typed inside
	// the collaborative session (so both editors share block identities and
	// have already exchanged updates) before the two users start typing
	// concurrently. This is the state in which human testers observed carets
	// sliding backwards and text landing out of order.
	test( 'two users typing simultaneously after exchanging edits produce in-order text', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	}, testInfo ) => {
		const post = await requestUtils.createPost( {
			title: 'Same Paragraph Concurrent Typing (converged)',
			content: '',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		// Warm-up: User A creates the paragraph and types everything except
		// the trailing "|", which User B contributes. Both users have now
		// made edits and received the other's edits, so block identities and
		// selection history are established on both sides.
		await editor.insertBlock( { name: 'core/paragraph' } );
		const warmupText = INITIAL_CONTENT.slice( 0, -1 );
		await page.keyboard.type( warmupText );

		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: warmupText },
				},
			] );

		await placeCaretAtOffset(
			page2,
			editor2.canvas.getByText( 'User A:' ),
			warmupText.length
		);
		await page2.keyboard.type( INITIAL_CONTENT.slice( -1 ) );

		await expect
			.poll( () => editor.getBlocks(), { timeout: 10000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: INITIAL_CONTENT },
				},
			] );

		// Position both carets before their own "|" marker.
		await placeCaretAtOffset(
			page,
			editor.canvas.getByText( 'User A:' ),
			USER_A_CARET_OFFSET
		);
		await placeCaretAtOffset(
			page2,
			editor2.canvas.getByText( 'User A:' ),
			USER_B_CARET_OFFSET
		);

		await expect
			.poll( () => getSelectionOffsets( page ) )
			.toEqual( {
				start: USER_A_CARET_OFFSET,
				end: USER_A_CARET_OFFSET,
			} );
		await expect
			.poll( () => getSelectionOffsets( page2 ) )
			.toEqual( {
				start: USER_B_CARET_OFFSET,
				end: USER_B_CARET_OFFSET,
			} );

		// Record selection/content timelines during the concurrent typing
		// phase so failures show how the carets actually moved.
		await installSelectionRecorder( page );
		await installSelectionRecorder( page2 );

		// Throttle both pages to consumer-hardware speed for the typing
		// phase only, so remote updates take realistic time to render.
		const [ restoreCpuA, restoreCpuB ] = await Promise.all( [
			setCpuThrottling( page, CPU_THROTTLE_RATE ),
			setCpuThrottling( page2, CPU_THROTTLE_RATE ),
		] );

		await Promise.all( [
			page.keyboard.type( USER_A_TEXT, { delay: TYPING_DELAY } ),
			page2.keyboard.type( USER_B_TEXT, { delay: TYPING_DELAY } ),
		] );

		await Promise.all( [ restoreCpuA(), restoreCpuB() ] );

		const [ timelineA, timelineB ] = await Promise.all( [
			getSelectionTimeline( page ),
			getSelectionTimeline( page2 ),
		] );

		await testInfo.attach( 'selection-timeline-user-a', {
			body: JSON.stringify( timelineA, null, 2 ),
			contentType: 'application/json',
		} );
		await testInfo.attach( 'selection-timeline-user-b', {
			body: JSON.stringify( timelineB, null, 2 ),
			contentType: 'application/json',
		} );

		const expectedParagraphs = [ EXPECTED_CONTENT ];

		await expect
			.poll(
				async () => {
					const [ userAParagraphs, userBParagraphs ] =
						await Promise.all( [
							getParagraphContents( page ),
							getParagraphContents( page2 ),
						] );

					return { userAParagraphs, userBParagraphs };
				},
				{ timeout: 15000 }
			)
			.toEqual( {
				userAParagraphs: expectedParagraphs,
				userBParagraphs: expectedParagraphs,
			} );

		// In an insert-only workload, neither caret may ever move backwards:
		// a backward jump is the "caret slid back" symptom even if the final
		// content happens to converge.
		expect(
			findBackwardCaretJumps( timelineA ),
			'User A caret moved backwards during concurrent typing'
		).toEqual( [] );
		expect(
			findBackwardCaretJumps( timelineB ),
			'User B caret moved backwards during concurrent typing'
		).toEqual( [] );
	} );
} );
