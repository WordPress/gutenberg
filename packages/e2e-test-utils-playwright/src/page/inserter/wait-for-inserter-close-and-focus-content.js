/**
 * Retrieves the document container by css class and checks to make sure the document's active element is within it
 */
export async function waitForInserterCloseAndContentFocus() {
	await this.canvas().waitForFunction(
		() =>
			document.activeElement.closest(
				'.block-editor-block-list__layout'
			) !== null
	);
}
