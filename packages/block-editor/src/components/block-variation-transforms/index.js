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
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
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
import { unlock } from '../../lock-unlock';

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
					__next40pxDefaultSize
					size="compact"
					key={ variation.name }
					icon={ <BlockIcon icon={ variation.icon } showColors /> }
					isPressed={ selectedValue === variation.name }
					label={
						selectedValue === variation.name
							? variation.title
							: sprintf(
									/* translators: %s: Block or block variation name. */
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
				<MenuGroup>
					<MenuItemsChoice
						choices={ selectOptions }
						value={ selectedValue }
						onSelect={ onSelectVariation }
					/>
				</MenuGroup>
			) }
		</DropdownMenu>
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
						icon={
							<BlockIcon icon={ variation.icon } showColors />
						}
						value={ variation.name }
						label={
							selectedValue === variation.name
								? variation.title
								: sprintf(
										/* translators: %s: Block or block variation name. */
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
	const { activeBlockVariation, variations, isContentOnly } = useSelect(
		( select ) => {
			const { getActiveBlockVariation, getBlockVariations } =
				select( blocksStore );

			const { getBlockName, getBlockAttributes, getBlockEditingMode } =
				select( blockEditorStore );

			const name = blockClientId && getBlockName( blockClientId );

			const { hasContentRoleAttribute } = unlock( select( blocksStore ) );
			const isContentBlock = hasContentRoleAttribute( name );

			return {
				activeBlockVariation: getActiveBlockVariation(
					name,
					getBlockAttributes( blockClientId )
				),
				variations: name && getBlockVariations( name, 'transform' ),
				isContentOnly:
					getBlockEditingMode( blockClientId ) === 'contentOnly' &&
					! isContentBlock,
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

	if ( ! variations?.length || isContentOnly ) {
		return null;
	}

	const baseClass = 'block-editor-block-variation-transforms';

	// Show buttons if there are more than 5 variations because the ToggleGroupControl does not wrap
	const showButtons = variations.length > 5;

	const ButtonComponent = showButtons
		? VariationsButtons
		: VariationsToggleGroupControl;

	const Component = hasUniqueIcons ? ButtonComponent : VariationsDropdown;

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
