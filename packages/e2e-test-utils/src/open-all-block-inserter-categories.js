/**
 * Opens all block inserter categories.
 */
export async function openAllBlockInserterCategories() {
	const notOpenCategoryPanels = await page.$$(
		'.block-editor-inserter__results .components-panel__body:not(.is-opened)'
	);
	for ( const categoryPanel of notOpenCategoryPanels ) {
		await categoryPanel.click();
	}
}
