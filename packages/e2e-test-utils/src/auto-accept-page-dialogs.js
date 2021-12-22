/** @typedef {import('puppeteer-core').Dialog} Dialog */

/**
 * Callback which automatically accepts dialog.
 *
 * @param {Dialog} dialog Dialog object dispatched by page via the 'dialog' event.
 */
async function acceptPageDialog( dialog ) {
	await dialog.accept();
}
/**
 * Enables event listener which auto-accepts all dialogs on the page.
 */
export function enablePageDialogAccept() {
	page.on( 'dialog', acceptPageDialog );
}
/**
 * Disable auto-accepting any dialogs.
 */
export function disablePageDialogAccept() {
	page.off( 'dialog', acceptPageDialog );
}
