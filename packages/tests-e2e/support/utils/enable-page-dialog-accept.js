/**
 * Callback which automatically accepts dialog.
 *
 * @param {puppeteer.Dialog} dialog Dialog object dispatched by page via the 'dialog' event.
 */
async function acceptPageDialog( dialog ) {
	await dialog.accept();
}
/**
 * Enables even listener which accepts a page dialog which
 * may appear when navigating away from Gutenberg.
 */
export function enablePageDialogAccept() {
	page.on( 'dialog', acceptPageDialog );
}
