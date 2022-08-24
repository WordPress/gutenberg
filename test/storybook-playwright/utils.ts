/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

const STORYBOOK_PORT = '50241';

export const gotoStoryId = ( page: Page, storyId: string ) =>
	page.goto(
		`http://localhost:${ STORYBOOK_PORT }/iframe.html?id=${ storyId }`,
		{ waitUntil: 'load' }
	);

export const waitForFMAnimation = async ( { page } ) =>
	await page.evaluate(
		() =>
			new Promise( ( resolve, reject ) => {
				const rootEl = document.getElementById( 'root' ) as HTMLElement;
				if ( ! rootEl ) {
					reject( 'Could not find #root element' );
				}

				let mutationTimer = setTimeout( resolve, 200 );
				const observer = new MutationObserver( () => {
					clearTimeout( mutationTimer );
					mutationTimer = setTimeout( resolve, 200 );
				} );

				observer.observe( rootEl, {
					subtree: true,
					childList: true,
					attributes: true,
				} );
			} )
	);
