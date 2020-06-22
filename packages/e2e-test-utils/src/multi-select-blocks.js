/**
 * Select multiple blocks on the editor given the start clientId and the end clientId.
 * The start block must be already selected.
 *
 * @param {string} start Identifier of the start block.
 * @param {string} end Identifier of the end block.
 */
export async function multiSelectBlocks( start, end ) {
	await page.evaluate(
		( startId, endId ) => {
			wp.data
				.dispatch( 'core/block-editor' )
				.multiSelect( startId, endId );
		},
		start,
		end
	);
}
