/**
 * Click on the close button of an open modal.
 *
 * @this {import('./').PageUtils}
 *
 * @param {?string} modalClassName Class name for the modal to close
 */
export async function clickOnCloseModalButton( modalClassName ) {
	let closeButtonClassName = '.components-modal__header .components-button';

	if ( modalClassName ) {
		closeButtonClassName = `${ modalClassName } ${ closeButtonClassName }`;
	}

	const closeButton = this.page.locator( closeButtonClassName );

	if ( closeButton ) {
		await this.page.click( closeButtonClassName );
	}
}
