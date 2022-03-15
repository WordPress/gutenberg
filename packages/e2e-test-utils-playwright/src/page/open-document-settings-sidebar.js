/**
 * @this {import('./').PageUtils}
 * Clicks on the button in the header which opens Document Settings sidebar when it is closed.
 */
export async function openDocumentSettingsSidebar() {
	const element = await this.page.$( '[aria-label="Settings"]' );
	const snapshot = await this.page.accessibility.snapshot( {
		root: element,
	} );

	const isSidebarOpened = snapshot.expanded;

	if ( ! isSidebarOpened ) {
		await element.click();
		await this.page.waitForSelector( '.edit-post-sidebar' );
	}
}
