/**
 * External dependencies
 */
import { first } from 'lodash';

/** @typedef {import('puppeteer').ElementHandle} ElementHandle */

/**
 * Finds the button responsible for toggling the sidebar panel with the provided title.
 *
 * @param {string} panelTitle The name of sidebar panel.
 *
 * @return {Promise<ElementHandle|undefined>} Object that represents an in-page DOM element.
 */
export async function findSidebarPanelWithTitle( panelTitle ) {
	const classSelect = ( className ) => `[contains(concat(" ", @class, " "), " ${ className } ")]`;
	const buttonSelector = `//div${ classSelect( 'edit-post-sidebar' ) }//button${ classSelect( 'components-button' ) }${ classSelect( 'components-panel__body-toggle' ) }[contains(text(),"${ panelTitle }")]`;
	const panelSelector = `${ buttonSelector }/ancestor::*[contains(concat(" ", @class, " "), " components-panel__body ")]`;
	return first( await page.$x( panelSelector ) );
}
