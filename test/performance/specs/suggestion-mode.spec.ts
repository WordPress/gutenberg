/* eslint-disable playwright/expect-expect */
/**
 * Suggestion mode performance: typing in Suggesting mode against an Editing
 * baseline on the same large post, and accepting a suggestion.
 *
 * Typing is measured like the post editor's `type` metric: the traced
 * `keydown`, `keypress` and `keyup` dispatches of each keystroke. The
 * suggestion keyboards handle `beforeinput`, which Chromium dispatches inside
 * `keypress`, so their work is included.
 */
import type { Page } from '@playwright/test';
import {
	test as base,
	expect,
	Metrics,
} from '@wordpress/e2e-test-utils-playwright';
import { PerfUtils } from '../fixtures';
import { median } from '../utils.js';

// See https://github.com/WordPress/gutenberg/issues/51383#issuecomment-1613460429
const BROWSER_IDLE_WAIT = 1000;

/*
 * A regression guard, not a target: Suggesting runs on the order of 1.5x the
 * Editing time on the large post. The margin keeps CI noise from failing it
 * while still catching work that grows with the document on every keystroke.
 */
const MAX_SUGGESTING_TO_EDITING_RATIO = 3;

const test = base.extend< { perfUtils: PerfUtils; metrics: Metrics } >( {
	perfUtils: async ( { page }, use ) => {
		await use( new PerfUtils( { page } ) );
	},
	metrics: async ( { page }, use ) => {
		await use( new Metrics( { page } ) );
	},
} );

const results: Record< string, number[] > = {
	suggestionTypeEditing: [],
	suggestionTypeSuggesting: [],
	suggestionAccept: [],
};

async function openNotesSidebar( page: Page ) {
	const toggle = page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'All notes', exact: true } );
	if ( ( await toggle.getAttribute( 'aria-expanded' ) ) === 'false' ) {
		await toggle.click();
	}
}

async function switchIntent( page: Page, label: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	await page.getByRole( 'menuitemradio' ).first().waitFor();
	const item = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ label }` ),
	} );
	// The branch under comparison may predate Suggestion mode.
	const exists = ( await item.count() ) > 0;
	if ( exists ) {
		await item.click();
	}
	await page.keyboard.press( 'Escape' );
	return exists;
}

test.describe( 'Suggestion mode performance', () => {
	let draftId: string | null = null;

	test.beforeAll( async ( { requestUtils } ) => {
		try {
			await requestUtils.setGutenbergExperiments( [
				'gutenberg-suggestion-mode',
			] );
		} catch ( error ) {
			// The branch under comparison may predate Suggestion mode, in
			// which case the experiment is not a known setting.
			if (
				( error as { code?: string } )?.code !== 'rest_invalid_param'
			) {
				throw error;
			}
		}
	} );

	test.afterAll( async ( { requestUtils }, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'Set up the test post', async ( { admin, perfUtils, editor } ) => {
		await admin.createNewPost();
		await perfUtils.loadBlocksForLargePost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Type here.' },
		} );
		draftId = await perfUtils.saveDraft();
	} );

	for ( const [ intent, key ] of [
		[ 'Editing', 'suggestionTypeEditing' ],
		[ 'Suggesting', 'suggestionTypeSuggesting' ],
	] as const ) {
		test( `Type in ${ intent } mode`, async ( {
			admin,
			perfUtils,
			metrics,
			page,
		} ) => {
			await admin.editPost( draftId! );
			await perfUtils.disableAutosave();
			test.skip(
				! ( await switchIntent( page, intent ) ),
				'Suggestion mode is unavailable.'
			);

			const canvas = await perfUtils.getCanvas();
			await canvas.getByText( 'Type here.' ).click();
			await page.keyboard.press( 'End' );

			// The first keystroke flips `isTyping` and, in Suggesting mode,
			// opens the suggestion's note, so it is left out.
			const samples = 20;
			const throwaway = 1;
			const iterations = samples + throwaway;

			await metrics.startTracing();
			await page.keyboard.type( 'x'.repeat( iterations ), {
				delay: BROWSER_IDLE_WAIT,
			} );
			await metrics.stopTracing( `suggestion-mode-type-${ intent }` );

			const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
				metrics.getTypingEventDurations();
			for ( let i = throwaway; i < iterations; i++ ) {
				results[ key ].push(
					keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
				);
			}

			if ( intent === 'Suggesting' ) {
				const editing = median( results.suggestionTypeEditing );
				const suggesting = median( results.suggestionTypeSuggesting );
				if ( editing && suggesting ) {
					expect( suggesting / editing ).toBeLessThan(
						MAX_SUGGESTING_TO_EDITING_RATIO
					);
				}
			}
		} );
	}

	test( 'Accept a suggestion', async ( {
		admin,
		perfUtils,
		page,
		requestUtils,
	} ) => {
		await requestUtils.deleteAllComments( 'note' );
		await admin.editPost( draftId! );
		await perfUtils.disableAutosave();
		test.skip(
			! ( await switchIntent( page, 'Suggesting' ) ),
			'Suggestion mode is unavailable.'
		);

		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		const canvas = await perfUtils.getCanvas();

		const samples = 3;
		for ( let i = 0; i < samples; i++ ) {
			await canvas.getByText( /^Type here\./ ).click();
			await page.keyboard.press( 'End' );
			// The suggestion's note is saved after a pause in typing.
			const saved = page.waitForResponse(
				( response ) =>
					/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
					[ 'POST', 'PUT' ].includes( response.request().method() ) &&
					response.ok()
			);
			await page.keyboard.type( ` accepted${ i }` );
			await saved;
			await openNotesSidebar( page );

			const accept = sidebar
				.getByRole( 'button', { name: 'Accept suggestion' } )
				.first();
			await accept.waitFor();
			const applied = page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion applied.' );

			const start = Date.now();
			await accept.click();
			await applied.waitFor();
			results.suggestionAccept.push( Date.now() - start );

			await applied.waitFor( { state: 'detached' } );
		}
	} );
} );

/* eslint-enable playwright/expect-expect */
