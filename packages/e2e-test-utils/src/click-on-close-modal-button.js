/**
 * Click on the close button of an open modal.
 *
 * @param {?string} modalClassName Class name for the modal to close
 */
export async function clickOnCloseModalButton(modalClassName) {
	let closeButtonClassName = '.components-modal__header .components-button';

	if (modalClassName) {
		closeButtonClassName = `${modalClassName} ${closeButtonClassName}`;
	}

	const closeButton = await page.$(closeButtonClassName);

	if (closeButton) {
		await page.click(closeButtonClassName);
	}
}
