/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * WordPress dependencies
 */
import { test as base, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { setCollaboration } from './fixtures/collaboration-utils';

const STEP1_CONTENT = readFileSync(
	join( __dirname, 'data', 'code-editor-perf-step1.md' ),
	'utf-8'
);

const STEP2_CONTENT = readFileSync(
	join( __dirname, 'data', 'code-editor-perf-step2.md' ),
	'utf-8'
);

// Maximum time (ms) the editor should take to become responsive after
// pasting new content into the code editor. If this threshold is exceeded
// the test fails, indicating a performance regression.
const RESPONSE_TIMEOUT_MS = 3_000;

type Fixtures = {
	collaborationEnabled: boolean;
};

// This test only needs collaboration enabled, not a second user.
const test = base.extend< Fixtures >( {
	collaborationEnabled: [
		async ( { requestUtils }, use ) => {
			await setCollaboration( requestUtils, true );
			await use( true );
			await setCollaboration( requestUtils, false );
		},
		{ auto: true },
	],
} );

test.describe( 'Collaboration - Code editor performance', () => {
	test( 'should not freeze when replacing content with large HTML in code editor', async ( {
		admin,
		context,
		editor,
		page,
		pageUtils,
	} ) => {
		await context.grantPermissions( [
			'clipboard-read',
			'clipboard-write',
		] );
		await admin.createNewPost();

		const codeEditor = page.getByRole( 'textbox', {
			name: 'Type text or HTML',
		} );

		// Step 1: Open the code editor and paste step 1 content.
		await pageUtils.pressKeys( 'secondary+M' );
		await codeEditor.fill( STEP1_CONTENT );

		// Step 2: Save the draft.
		await pageUtils.pressKeys( 'primary+s' );
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Draft saved' } )
		).toBeVisible();

		// Step 3: Replace with step 2 content using clipboard paste, which
		// triggers the same input event processing as a real user paste.
		// This is the operation that causes the editor to freeze.
		await codeEditor.focus();

		// Write step 2 content to the clipboard.
		await page.evaluate(
			( text: string ) => window.navigator.clipboard.writeText( text ),
			STEP2_CONTENT
		);

		// Select all existing content and paste over it. Measure wall-clock
		// time from the paste through switching to visual mode and blocks
		// being fully parsed. This captures any main-thread freeze.
		const startTime = performance.now();

		// Use pressKeys for select-all (maps to correct modifier per
		// platform). We can't use pressKeys for paste because it emulates
		// the ClipboardEvent instead of doing a real keyboard paste, so we
		// use page.keyboard.press directly with the platform modifier.
		await pageUtils.pressKeys( 'primary+a' );
		const pasteModifier =
			process.platform === 'darwin' ? 'Meta' : 'Control';
		await page.keyboard.press( `${ pasteModifier }+v` );

		// Step 4: Switch to visual mode. The editor must process the
		// pasted content before it can handle this shortcut.
		await pageUtils.pressKeys( 'secondary+M' );

		// Wait for blocks to be parsed (generous timeout so the test
		// doesn't fail from the Playwright timeout itself).
		await expect
			.poll(
				async () => {
					const blocks = await editor.getBlocks();
					return blocks.some(
						( block ) =>
							block.name === 'core/heading' &&
							( block.attributes?.content as string )?.includes(
								'Planned Versions'
							)
					);
				},
				{ timeout: 20_000 }
			)
			.toBe( true );

		const elapsed = performance.now() - startTime;

		// The actual performance assertion: the entire paste-to-blocks
		// cycle must complete within the threshold.
		expect( elapsed ).toBeLessThan( RESPONSE_TIMEOUT_MS );
	} );
} );
