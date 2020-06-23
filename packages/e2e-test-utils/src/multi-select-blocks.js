/**
 * Internal dependencies
 */
import { wpDataDispatch } from './wp-data-dispatch';

/**
 * Select multiple blocks on the editor given the start clientId and the end clientId.
 * The start block must be already selected.
 *
 * @param {string} start Identifier of the start block.
 * @param {string} end Identifier of the end block.
 */
export async function multiSelectBlocks( start, end ) {
	return wpDataDispatch( 'core/block-editor', 'multiSelect', start, end );
}
