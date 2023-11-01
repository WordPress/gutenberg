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
import { useMemo } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
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
					icon={ <BlockIcon icon={ variation.icon } showColors /> }
					isPressed={ selectedValue === variation.name }
					label={
						selectedValue === variation.name
							? variation.title
							: sprintf(
									/* translators: %s: Name of the block variation */
									__( 'Transform to %s' ),
									variation.title
							  )
					}
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

	const selectedValue = activeBlockVariation?.name;

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

	const Component = hasUniqueIcons ? VariationsButtons : VariationsDropdown;

	return (
		<Component
			className={ baseClass }
			onSelectVariation={ onSelectVariation }
			selectedValue={ selectedValue }
			variations={ variations }
		/>
	);
}

export default __experimentalBlockVariationTransforms;
