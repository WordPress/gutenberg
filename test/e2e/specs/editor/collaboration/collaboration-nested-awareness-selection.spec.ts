/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Nested Awareness Selection', () => {
	test( 'cursor in a table cell is visible to another user', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Nested Awareness Selection Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content:
				'<!-- wp:table -->\n' +
				'<figure class="wp-block-table"><table><tbody><tr><td>Alpha</td><td>Beta</td></tr></tbody></table></figure>\n' +
				'<!-- /wp:table -->',
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		await expect
			.poll( () => collaborationUtils.editor2.getBlocks(), {
				timeout: 10000,
			} )
			.toMatchObject( [
				{
					name: 'core/table',
				},
			] );

		const firstCell = editor.canvas.locator(
			'role=textbox[name="Body cell text"i] >> nth=0'
		);

		await firstCell.click();
		await firstCell.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'ArrowRight' );

		await expect
			.poll(
				() =>
					page.evaluate(
						() =>
							window.wp.data
								.select( 'core/block-editor' )
								.getSelectionStart()?.attributeKey ?? ''
					),
				{ timeout: 5000 }
			)
			.toMatch( /^body\.0\.cells\.[01]\.content$/ );

		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const cursor = editorFrame.locator(
			'.collaborators-overlay-user-cursor'
		);

		await expect
			.poll( () => cursor.count(), { timeout: 15000 } )
			.toBeGreaterThan( 0 );

		const boundingBox = await cursor.first().boundingBox();
		expect( boundingBox ).toBeTruthy();
		expect( boundingBox!.height ).toBeGreaterThan( 0 );
	} );
} );
