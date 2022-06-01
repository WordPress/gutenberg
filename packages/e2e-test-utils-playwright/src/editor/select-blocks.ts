/**
 * External dependencies
 */
import type { Locator } from '@playwright/test';

/**
 * Internal dependencies
 */
import type { Editor } from './index';

export async function selectBlocks(
	this: Editor,
	startSelectorOrLocator: string | Locator,
	endSelectorOrLocator?: string | Locator
) {
	const startBlock =
		typeof startSelectorOrLocator === 'string'
			? this.canvas.locator( startSelectorOrLocator )
			: startSelectorOrLocator;

	const endBlock =
		typeof endSelectorOrLocator === 'string'
			? this.canvas.locator( endSelectorOrLocator )
			: endSelectorOrLocator;

	const startClientId = await startBlock.getAttribute( 'data-block' );
	const endClientId = await endBlock?.getAttribute( 'data-block' );

	if ( endClientId ) {
		await this.page.evaluate(
			( [ startId, endId ] ) => {
				// @ts-ignore
				wp.data
					.dispatch( 'core/block-editor' )
					.multiSelect( startId, endId );
			},
			[ startClientId, endClientId ]
		);
	} else {
		await this.page.evaluate(
			( [ clientId ] ) => {
				// @ts-ignore
				wp.data.dispatch( 'core/block-editor' ).selectBlock( clientId );
			},
			[ startClientId ]
		);
	}
}
