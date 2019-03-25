/**
 * Opens all block inserter categories.
 */
export async function openAllBlockInserterCategories() {
	const notOppenedCategorySelector = '.block-editor-inserter__results .components-panel__body:not(.is-opened)';
	let categoryPanel = await page.$( notOppenedCategorySelector );
	while ( categoryPanel !== null ) {
		await categoryPanel.click();
		categoryPanel = await page.$( notOppenedCategorySelector );
	}
}
