/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	cloneBlock,
	getBlockType,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getActiveStyle, getRenderedStyles, replaceActiveStyle } from './utils';
import { store as blockEditorStore } from '../../store';

/**
 *
 * @param {WPBlock}     block Block object.
 * @param {WPBlockType} type  Block type settings.
 * @return {WPBlock}          A generic block ready for styles preview.
 */
function useGenericPreviewBlock( block, type ) {
	return useMemo( () => {
		const example = type?.example;
		const blockName = type?.name;

		if ( example && blockName ) {
			return getBlockFromExample( blockName, {
				attributes: example.attributes,
				innerBlocks: example.innerBlocks,
			} );
		}

		if ( block ) {
			return cloneBlock( block );
		}
	}, [ type?.example ? block?.name : block, type ] );
}

/**
 * @typedef useStylesForBlocksArguments
 * @property {string}     clientId Block client ID.
 * @property {() => void} onSwitch Block style switch callback function.
 */

/**
 *
 * @param {useStylesForBlocksArguments} useStylesForBlocks arguments.
 * @return {Object}                                         Results of the select methods.
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
	const { styles, block, blockType, className } = useSelect( selector, [
		clientId,
	] );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const stylesToRender = getRenderedStyles( styles );
	const activeStyle = getActiveStyle( stylesToRender, className );
	const genericPreviewBlock = useGenericPreviewBlock( block, blockType );

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
		genericPreviewBlock,
		className,
	};
}
