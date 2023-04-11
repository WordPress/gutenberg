/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * This hook checks if any applied block variation style is set,
 * but the respective block variation is not active now.
 *
 * In this case this hook performs a side effect to remove
 * that style(class name) and doesn't create an `undo` step.
 *
 * @param {string} clientId The block client ID.
 *
 */
export default function useCleanBlockStyles( clientId ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { styleToRemove, blockClassNames } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockName } =
				select( blockEditorStore );
			const { getActiveBlockVariation, getBlockVariationStyles } =
				select( blocksStore );
			const attributes = getBlockAttributes( clientId );
			if ( ! attributes.className ) {
				return {};
			}
			// Here we are checking if the block has a block style for a specific
			// block variation. If it does and the block variation is no longer active,
			// we need to remove the style class name.
			const blockName = getBlockName( clientId );
			const match = getActiveBlockVariation( blockName, attributes );
			const blockVariationStyles = getBlockVariationStyles( blockName );
			return {
				styleToRemove: blockVariationStyles?.find(
					( { name: styleName, variations } ) =>
						attributes.className.includes(
							`is-style-${ styleName }`
						) &&
						( ! match || ! variations.includes( match.name ) )
				)?.name,
				blockClassNames: attributes.className,
			};
		},
		[ clientId ]
	);
	useEffect( () => {
		if ( styleToRemove === undefined ) {
			return;
		}
		const updatedClassNames = blockClassNames
			.split( ' ' )
			.filter(
				( blockClassName ) =>
					! blockClassName.includes( `is-style-${ styleToRemove }` )
			)
			.join( ' ' );
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( clientId, {
			className: updatedClassNames,
		} );
	}, [ clientId, styleToRemove, blockClassNames ] );
}
