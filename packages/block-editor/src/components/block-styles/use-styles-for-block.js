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
import { cleanEmptyObject } from '../../hooks/utils';

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
		const { getBlock, getSettings } = select( blockEditorStore );
		const block = getBlock( clientId );

		if ( ! block ) {
			return {};
		}
		const blockType = getBlockType( block.name );
		const { getBlockStyles } = select( blocksStore );
		const styles = getBlockStyles( block.name );

		// Add theme.json styles for each block style if available.
		// These will be used to customize the block style control
		// For example, by displaying color swatches.
		const variations =
			getSettings().__experimentalStyles?.blocks?.[ block.name ]
				?.variations ?? {};

		if ( variations ) {
			styles?.forEach( ( style, index ) => {
				if ( variations[ style.name ] ) {
					styles[ index ].styles = variations[ style.name ];
				}
			} );
		}

		return {
			block,
			blockType,
			styles,
			className: block.attributes.className || '',
			attributes: block.attributes,
		};
	};
	const { styles, block, blockType, className, attributes } = useSelect(
		selector,
		[ clientId ]
	);
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

		const newStyleAttribute = cleanEmptyObject( {
			...attributes.style,
			variation: style.name !== 'default' ? style.name : undefined,
		} );

		updateBlockAttributes( clientId, {
			className: styleClassName,
			style: newStyleAttribute,
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
