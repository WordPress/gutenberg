/**
 * Internal dependencies
 */
import { pressKeyWithModifier } from './press-key-with-modifier';
import { __unstableSelectAll } from './select-all';

/**
 * Selects all blocks present in the block editor.
 *
 * @return {Promise} Promise resolving once active element selected.
 */
export async function selectAllBlocks() {
	// NOTE: `__unstableSelectAll` is used for cross-platform compatibility
	// alternative to Cmd+A. The second issuance of the key combination is
	// handled internerally by the block editor's KeyboardShortcuts utility,
	// and is not subject to the same buggy browser/OS emulation.
	await __unstableSelectAll();
	await pressKeyWithModifier( 'primary', 'a' );
}
