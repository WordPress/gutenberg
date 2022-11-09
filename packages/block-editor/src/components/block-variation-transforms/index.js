/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function __experimentalBlockVariationTransforms( { blockClientId } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { activeBlockVariation, variations } = useSelect(
		( select ) => {
			const { getActiveBlockVariation, getBlockVariations } =
				select( blocksStore );
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const name = blockClientId && getBlockName( blockClientId );
			return {
				activeBlockVariation: getActiveBlockVariation(
					name,
					getBlockAttributes( blockClientId )
				),
				variations: name && getBlockVariations( name, 'transform' ),
			};
		},
		[ blockClientId ]
	);

	const selectedVariationName = activeBlockVariation?.name;

	// Check if each variation has a unique icon.
	const hasUniqueIcons = useMemo( () => {
		const variationIcons = new Set();
		if ( ! variations ) {
			return false;
		}
		variations.forEach( ( variation ) => {
			if ( variation.icon ) {
				variationIcons.add( variation.icon?.src || variation.icon );
			}
		} );
		return variationIcons.size === variations.length;
	}, [ variations ] );

	const onSelectVariation = ( variationName ) => {
		updateBlockAttributes( blockClientId, {
			...variations.find( ( { name } ) => name === variationName )
				.attributes,
		} );
	};

	const baseClass = 'block-editor-block-variation-transforms';

	// Skip rendering if there are no variations
	if ( ! variations?.length ) return null;

	return (
		<div className={ baseClass }>
			<ToggleGroupControl
				label={ __( 'Transform to variation' ) }
				hideLabelFromVision={ true }
				onChange={ onSelectVariation }
				value={ selectedVariationName }
			>
				{ variations.map( ( variation ) => {
					if ( hasUniqueIcons ) {
						const variationLabel =
							selectedVariationName === variation.name
								? variation.title
								: sprintf(
										/* translators: %s: Name of the block variation */
										__( 'Transform to %s' ),
										variation.title
								  );
						return (
							<ToggleGroupControlOptionIcon
								key={ variation.name }
								icon={ variation.icon }
								label={ variationLabel }
								value={ variation.name }
							/>
						);
					}

					return (
						<ToggleGroupControlOption
							key={ variation.name }
							label={ variation.title }
							showTooltip={ true }
							value={ variation.name }
						/>
					);
				} ) }
			</ToggleGroupControl>
		</div>
	);
}

export default __experimentalBlockVariationTransforms;
