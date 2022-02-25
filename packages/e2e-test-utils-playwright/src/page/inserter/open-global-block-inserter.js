/**
 * Opens the global block inserter.
 *
 * @this {import('./').PageUtils}
 */
export async function openGlobalBlockInserter() {
	if ( await this.isGlobalInserterOpen() ) {
		// If global inserter is already opened, reset to an initial state where
		// the default (first) tab is selected.
		const tab = this.page.locator(
			'.block-editor-inserter__tabs .components-tab-panel__tabs-item:nth-of-type(1):not(.is-active)'
		);

		if ( tab ) {
			await tab.click();
		}
	} else {
		await this.toggleGlobalBlockInserter();
	}
}
