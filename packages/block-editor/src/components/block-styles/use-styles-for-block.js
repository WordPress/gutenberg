/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getActiveStyle, getRenderedStyles, replaceActiveStyle } from './utils';
import { store as blockEditorStore } from '../../store';

/**
 * @typedef useStylesForBlocksArguments
 * @property {string}     clientId Block client ID.
 * @property {() => void} onSwitch Block style switch callback function.
 */

/**
 * Returns the collection of available block styles, the currently active
 * block style, as well as an onSelect handler to update block attributes
 * with the selected block style's className.
 *
 * @param {useStylesForBlocksArguments} useStylesForBlocks arguments.
 *
 * @return {Object} Results of the select methods.
 */
export default function useStylesForBlocks( { clientId, onSwitch } ) {
	const selector = ( select ) => {
		const { getBlock } = select( blockEditorStore );
		const block = getBlock( clientId );

		if ( ! block ) {
			return {};
		}
		const blockType = getBlockType( block.name );
		const { getBlockStyles } = select( blocksStore );

		return {
			block,
			blockType,
			styles: getBlockStyles( block.name ),
			className: block.attributes.className || '',
		};
	};
	const { styles, className } = useSelect( selector, [ clientId ] );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const stylesToRender = getRenderedStyles( styles );
	const activeStyle = getActiveStyle( stylesToRender, className );

	const onSelect = ( style ) => {
		const styleClassName = replaceActiveStyle(
			className,
			activeStyle,
			style
		);
		updateBlockAttributes( clientId, {
			className: styleClassName,
		} );
		onSwitch();
	};

	return {
		onSelect,
		stylesToRender,
		activeStyle,
	};
}
