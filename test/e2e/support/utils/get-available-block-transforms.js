/**
 * Internal dependencies
 */
import { hasBlockSwitcher } from './has-block-switcher';

/**
 * Returns an array of strings with all block titles,
 * that the current selected block can be transformed into.
 *
 * @return {Promise} Promise resolving with an array containing all possible block transforms
 */
export const getAvailableBlockTransforms = async () => {
	if ( ! await hasBlockSwitcher() ) {
		return [];
	}
	await page.click( '.editor-block-toolbar .editor-block-switcher' );
	return page.evaluate( ( buttonSelector ) => {
		return Array.from(
			document.querySelectorAll(
				buttonSelector
			)
		).map(
			( button ) => {
				return button.getAttribute( 'aria-label' );
			}
		);
	}, '.editor-block-types-list .editor-block-types-list__list-item button' );
};
