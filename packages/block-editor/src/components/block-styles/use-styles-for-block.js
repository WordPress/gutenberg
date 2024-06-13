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
import { globalStylesDataKey } from '../../store/private-keys';

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
		const settings = getSettings();
		const variations =
			settings[ globalStylesDataKey ]?.blocks?.[ block.name ]?.variations;

		return {
			block,
			blockType,
			styles: getBlockStyles( block.name ),
			className: block.attributes.className || '',
			variations: Object.keys( variations ?? {} ),
		};
	};
	const { styles, block, blockType, className, variations } = useSelect(
		selector,
		[ clientId ]
	);

	// Filter out any stale block style registrations e.g. when a block style
	// variation was registered by a theme style variation and then the theme
	// style variation is deregistered.
	const filteredStyles = styles?.filter(
		( style ) =>
			style.source === 'block' || variations.includes( style.name )
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const stylesToRender = getRenderedStyles( filteredStyles );
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
