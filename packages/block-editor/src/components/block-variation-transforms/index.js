/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
	VisuallyHidden,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { __experimentalGetMatchingVariation as getMatchingVariation } from '../../utils';
import { store as blockEditorStore } from '../../store';

function VariationsButtons( {
	className,
	onSelectVariation,
	selectedValue,
	variations,
} ) {
	return (
		<fieldset className={ className }>
			<VisuallyHidden as="legend">
				{ __( 'Transform to variation' ) }
			</VisuallyHidden>
			{ variations.map( ( variation ) => (
				<Button
					key={ variation.name }
					icon={ variation.icon }
					isPressed={ selectedValue === variation.name }
					label={ sprintf(
						/* translators: %s: Name of the block variation */
						__( 'Transform to %s' ),
						variation.title
					) }
					onClick={ () => onSelectVariation( variation.name ) }
					aria-label={ variation.title }
					showTooltip
				/>
			) ) }
		</fieldset>
	);
}

function VariationsDropdown( {
	className,
	onSelectVariation,
	selectedValue,
	variations,
} ) {
	const selectOptions = variations.map(
		( { name, title, description } ) => ( {
			value: name,
			label: title,
			info: description,
		} )
	);

	return (
		<DropdownMenu
			className={ className }
			label={ __( 'Transform to variation' ) }
			text={ __( 'Transform to variation' ) }
			popoverProps={ {
				position: 'bottom center',
				className: `${ className }__popover`,
			} }
			icon={ chevronDown }
			toggleProps={ { iconPosition: 'right' } }
		>
			{ () => (
				<div className={ `${ className }__container` }>
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

	// Check if each variation has a unique icon.
	const hasUniqueIcons = useMemo( () => {
		const variationIcons = new Set();
		variations.forEach( ( variation ) => {
			if ( variation.icon ) {
				variationIcons.add( variation.icon );
			}
		} );
		return variationIcons.size === variations.length;
	}, [ variations ] );

	if ( ! variations?.length ) return null;

	const onSelectVariation = ( variationName ) => {
		updateBlockAttributes( blockClientId, {
			...variations.find( ( { name } ) => name === variationName )
				.attributes,
		} );
	};
	const baseClass = 'block-editor-block-variation-transforms';

	// If each variation has a unique icon, then render the variations as a set of buttons.
	if ( hasUniqueIcons ) {
		return (
			<VariationsButtons
				className={ baseClass }
				onSelectVariation={ onSelectVariation }
				selectedValue={ selectedValue }
				variations={ variations }
			/>
		);
	}

	// Fallback to a dropdown list of options if each variation does not have a unique icon.
	return (
		<VariationsDropdown
			className={ baseClass }
			onSelectVariation={ onSelectVariation }
			selectedValue={ selectedValue }
			variations={ variations }
		/>
	);
}

export default __experimentalBlockVariationTransforms;
