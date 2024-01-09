/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuItemHelpTextV2: DropdownMenuItemHelpText,
} = unlock( componentsPrivateApis );

function VariationsDropdown( {
	className,
	onSelectVariation,
	selectedValue,
	variations,
} ) {
	const activeVariation = variations.find(
		( { name } ) => name === selectedValue
	);
	return (
		<HStack className={ className } justify="flex-start">
			<FlexItem>{ __( 'Variation' ) }</FlexItem>
			<DropdownMenu
				className={ className }
				trigger={
					<Button variant="tertiary">
						{ activeVariation.title }
					</Button>
				}
			>
				<DropdownMenuGroup>
					{ variations.map( ( variation ) => {
						return (
							<DropdownMenuRadioItem
								key={ variation.name }
								value={ variation.name }
								name="block-variation-transforms-active-variation"
								checked={
									variation.name === activeVariation.name
								}
								onChange={ () => {
									onSelectVariation( variation.name );
								} }
							>
								<DropdownMenuItemLabel>
									{ variation.title }
								</DropdownMenuItemLabel>
								{ !! variation.description && (
									<DropdownMenuItemHelpText>
										{ variation.description }
									</DropdownMenuItemHelpText>
								) }
							</DropdownMenuRadioItem>
						);
					} ) }
				</DropdownMenuGroup>
			</DropdownMenu>
		</HStack>
	);
}

function VariationsToggleGroupControl( {
	className,
	onSelectVariation,
	selectedValue,
	variations,
} ) {
	return (
		<div className={ className }>
			<ToggleGroupControl
				label={ __( 'Transform to variation' ) }
				value={ selectedValue }
				hideLabelFromVision
				onChange={ onSelectVariation }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			>
				{ variations.map( ( variation ) => (
					<ToggleGroupControlOptionIcon
						key={ variation.name }
						icon={ variation.icon }
						value={ variation.name }
						label={
							selectedValue === variation.name
								? variation.title
								: sprintf(
										/* translators: %s: Name of the block variation */
										__( 'Transform to %s' ),
										variation.title
								  )
						}
					/>
				) ) }
			</ToggleGroupControl>
		</div>
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

	// Skip rendering if there are no variations.
	if ( ! variations?.length ) return null;

	const baseClass = 'block-editor-block-variation-transforms';

	// Show dropdown if there are more than 5 variations or if available variations
	// don't have unique icons.
	const renderDropdown = variations.length > 5 || ! hasUniqueIcons;

	const Component = renderDropdown
		? VariationsDropdown
		: VariationsToggleGroupControl;

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
