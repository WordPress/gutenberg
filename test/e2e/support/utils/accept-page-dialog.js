/**
 * Callback which automatically accepts dialog.
 *
 * @param {puppeteer.Dialog} dialog Dialog object dispatched by page via the 'dialog' event.
 */
export async function acceptPageDialog( dialog ) {
	await dialog.accept();
}
