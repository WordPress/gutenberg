/**
 * Internal dependencies
 */
import type { Editor } from './index';
import { insertBlock, type BlockRepresentation } from './insert-block';

/**
 * Insert a block and wait for a given selector to be visible.
 *
 * @param this
 * @param blockRepresentation Inserted block representation.
 * @param selector            Selector to wait for to be visible.
 */
async function insertBlockAndWaitForSelector(
	this: Editor,
	blockRepresentation: BlockRepresentation,
	selector: string
) {
	await insertBlock.call( this, blockRepresentation );
	await this.page.locator( selector ).isVisible();
}

export type { BlockRepresentation };
export { insertBlockAndWaitForSelector };
