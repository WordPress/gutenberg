/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { __experimentalGetMatchingVariation as getMatchingVariation } from '../../utils';
import { store as blockEditorStore } from '../../store';

function __experimentalBlockVariationTransforms( { blockClientId } ) {
	const [ selectedValue, setSelectedValue ] = useState();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { variations, blockAttributes } = useSelect(
		( select ) => {
			const { getBlockVariations } = select( blocksStore );
			const { getBlockName, getBlockAttributes } = select(
				blockEditorStore
			);
			const blockName = blockClientId && getBlockName( blockClientId );
			return {
				variations:
					blockName && getBlockVariations( blockName, 'transform' ),
				blockAttributes: getBlockAttributes( blockClientId ),
			};
		},
		[ blockClientId ]
	);
	useEffect( () => {
		setSelectedValue(
			getMatchingVariation( blockAttributes, variations )?.name
		);
	}, [ blockAttributes, variations ] );
	if ( ! variations?.length ) return null;

	const selectOptions = variations.map(
		( { name, title, description } ) => ( {
			value: name,
			label: title,
			info: description,
		} )
	);
	const onSelectVariation = ( variationName ) => {
		updateBlockAttributes( blockClientId, {
			...variations.find( ( { name } ) => name === variationName )
				.attributes,
		} );
	};
	const baseClass = 'block-editor-block-variation-transforms';
	return (
		<DropdownMenu
			className={ baseClass }
			label={ __( 'Transform to variation' ) }
			text={ __( 'Transform to variation' ) }
			popoverProps={ {
				position: 'bottom center',
				className: `${ baseClass }__popover`,
			} }
			icon={ chevronDown }
			toggleProps={ { iconPosition: 'right' } }
		>
			{ () => (
				<div className={ `${ baseClass }__container` }>
					<MenuGroup>
						<MenuItemsChoice
							choices={ selectOptions }
							value={ selectedValue }
							onSelect={ onSelectVariation }
						/>
					</MenuGroup>
				</div>
			) }
		</DropdownMenu>
	);
}

export default __experimentalBlockVariationTransforms;
