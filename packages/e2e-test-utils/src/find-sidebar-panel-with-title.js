/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * Finds the button responsible for toggling the sidebar panel with the provided title.
 *
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {?ElementHandle} Object that represents an in-page DOM element.
 */
export async function findSidebarPanelWithTitle( panelTitle ) {
	const classSelect = ( className ) => `[contains(concat(" ", @class, " "), " ${ className } ")]`;
	const buttonSelector = `//div${ classSelect( 'edit-post-sidebar' ) }//button${ classSelect( 'components-button' ) }${ classSelect( 'components-panel__body-toggle' ) }[contains(text(),"${ panelTitle }")]`;
	const panelSelector = `${ buttonSelector }/ancestor::*[contains(concat(" ", @class, " "), " components-panel__body ")]`;
	return first( await await page.$x( panelSelector ) );
}
