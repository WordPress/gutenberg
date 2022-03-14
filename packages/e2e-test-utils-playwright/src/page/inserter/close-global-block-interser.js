/**
 * Moves focus to the selected block.
 *
 * @this {import('./').PageUtils}
 */
export async function closeGlobalBlockInserter() {
	if ( await this.isGlobalInserterOpen() ) {
		await this.toggleGlobalBlockInserter();
	}
}
