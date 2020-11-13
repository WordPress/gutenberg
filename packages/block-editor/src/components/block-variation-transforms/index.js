/**
 * External dependencies
 */
import { isMatch } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';

export const getMatchingVariationName = ( blockAttributes, variations ) => {
	if ( ! variations || ! blockAttributes ) return;
	const matches = variations.filter( ( { attributes } ) => {
		if ( ! attributes || ! Object.keys( attributes ).length ) return false;
		return isMatch( blockAttributes, attributes );
	} );
	if ( matches.length !== 1 ) return;
	return matches[ 0 ].name;
};

function __experimentalBlockVariationTransforms( { blockClientId } ) {
	const [ selectedValue, setSelectedValue ] = useState();
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const { variations, blockAttributes } = useSelect(
		( select ) => {
			const { getBlockVariations } = select( 'core/blocks' );
			const { getBlockName, getBlockAttributes } = select(
				'core/block-editor'
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
			getMatchingVariationName( blockAttributes, variations )
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
