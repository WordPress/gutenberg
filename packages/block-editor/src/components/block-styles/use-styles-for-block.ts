import { useDispatch, useSelect } from '@wordpress/data';
import {
	cloneBlock,
	getBlockType,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';
import type { Block, BlockStyle, BlockType } from '@wordpress/blocks';
import type { SelectFunction } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { getActiveStyle, getRenderedStyles, replaceActiveStyle } from './utils';
import { store as blockEditorStore } from '../../store';
import type {
	StylesForBlocksSelection,
	UseStylesForBlocksArguments,
} from './types';

/**
 *
 * @param block Block object.
 * @param type  Block type settings.
 * @return A generic block ready for styles preview.
 */
function useGenericPreviewBlock(
	block: Block | null | undefined,
	type: BlockType | undefined
): Block | void {
	return useMemo( (): Block | void => {
		const example = type?.example;
		const blockName = type?.name;

		if ( example && blockName ) {
			return getBlockFromExample( blockName, {
				attributes: example.attributes,
				innerBlocks: example.innerBlocks,
				innerContent: example.innerContent,
			} );
		}

		if ( block ) {
			return cloneBlock( block );
		}
	}, [ block, type?.example, type?.name ] );
}

/**
 *
 * @param useStylesForBlocks          arguments.
 * @param useStylesForBlocks.clientId Block client ID.
 * @param useStylesForBlocks.onSwitch Block style switch callback function.
 * @return Results of the select methods.
 */
export default function useStylesForBlocks( {
	clientId,
	onSwitch,
}: UseStylesForBlocksArguments ) {
	const selector = ( select: SelectFunction ): StylesForBlocksSelection => {
		const { getBlock } = select( blockEditorStore );
		const block = getBlock( clientId );

		if ( ! block ) {
			return {};
		}
		const blockType = getBlockType( block.name );
		const { getBlockStyles } = select( blocksStore );

		return {
			block: ! blockType?.example ? block : null,
			blockType,
			styles: getBlockStyles( block.name ),
			className: ( block.attributes.className as string ) || '',
		};
	};
	const { styles, block, blockType, className } = useSelect( selector, [
		clientId,
	] );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const stylesToRender = getRenderedStyles( styles );
	// The rendered styles include a default, so a style is active unless
	// there are none to render.
	const activeStyle = getActiveStyle(
		stylesToRender,
		className
	) as BlockStyle;
	const genericPreviewBlock = useGenericPreviewBlock( block, blockType );

	const onSelect = ( style: BlockStyle ) => {
		const styleClassName = replaceActiveStyle(
			className,
			activeStyle,
			style
		);
		updateBlockAttributes( clientId, {
			className: styleClassName,
		} );
		// Callers selecting styles pass the switch callback.
		onSwitch!();
	};

	return {
		onSelect,
		stylesToRender,
		activeStyle,
		genericPreviewBlock,
		className,
	};
}
