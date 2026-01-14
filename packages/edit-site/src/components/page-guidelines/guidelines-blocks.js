/**
 * WordPress dependencies
 */
import { BlocksPanel } from '@wordpress/content-guidelines';

/**
 * Blocks section - per-block guideline overrides.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.initialBlock  Initial block name from URL.
 * @param {Function} props.onBlockChange Callback when block selection changes.
 * @return {JSX.Element} Blocks panel.
 */
export default function GuidelinesBlocks( { initialBlock, onBlockChange } ) {
	return (
		<BlocksPanel
			initialBlock={ initialBlock }
			onBlockChange={ onBlockChange }
		/>
	);
}
