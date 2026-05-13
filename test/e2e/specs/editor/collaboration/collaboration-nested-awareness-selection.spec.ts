/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Nested Awareness Selection', () => {
	test( 'cursor in a table cell appears in the same cell for another user', async ( {
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
				'<figure class="wp-block-table"><table><tbody>' +
				'<tr><td>Alpha</td><td>Beta</td></tr>' +
				'<tr><td>Gamma</td><td>Delta</td></tr>' +
				'</tbody></table></figure>\n' +
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

		// Target the last cell — row 1, column 1 ("Delta"), which is nth=3
		// in a 2x2 grid. Picking the last cell maximizes distance from the
		// first cell, so a bug that flattens offsets onto cell (0,0) is
		// easy to detect via bounding boxes below.
		const targetCell = editor.canvas.locator(
			'role=textbox[name="Body cell text"i] >> nth=3'
		);

		await targetCell.click();
		await targetCell.click();
		await page.keyboard.press( 'End' );

		// Sender side: selection state should point to the target cell's
		// nested attribute path.
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
			.toBe( 'body.1.cells.1.content' );

		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const cursor = editorFrame.locator(
			'.collaborators-overlay-user-cursor'
		);

		await expect
			.poll( () => cursor.count(), { timeout: 15000 } )
			.toBeGreaterThan( 0 );

		const cursorBox = await cursor.first().boundingBox();
		if ( ! cursorBox ) {
			throw new Error( 'Collaborator cursor bounding box not available' );
		}
		expect( cursorBox.height ).toBeGreaterThan( 0 );

		// Receiver side: verify the rendered cursor lands inside the same
		// cell, not flattened onto the first cell.
		const remoteCell = editorFrame.locator(
			'role=textbox[name="Body cell text"i] >> nth=3'
		);
		const cellBox = await remoteCell.boundingBox();
		if ( ! cellBox ) {
			throw new Error( 'Remote target cell bounding box not available' );
		}

		const cursorCenterX = cursorBox.x + cursorBox.width / 2;
		const cursorCenterY = cursorBox.y + cursorBox.height / 2;
		expect( cursorCenterX ).toBeGreaterThanOrEqual( cellBox.x );
		expect( cursorCenterX ).toBeLessThanOrEqual(
			cellBox.x + cellBox.width
		);
		expect( cursorCenterY ).toBeGreaterThanOrEqual( cellBox.y );
		expect( cursorCenterY ).toBeLessThanOrEqual(
			cellBox.y + cellBox.height
		);
	} );
} );
