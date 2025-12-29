/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	VisuallyHidden,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

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
	return (
		<div className={ className }>
			<Menu>
				<Menu.TriggerButton
					render={
						<Button
							className="block-editor-block-variation-transforms__button"
							__next40pxDefaultSize
							variant="secondary"
						>
							{ __( 'Transform to variation' ) }
						</Button>
					}
				/>
				<Menu.Popover position="bottom">
					<Menu.Group>
						{ variations.map( ( variation ) => (
							<Menu.RadioItem
								key={ variation.name }
								value={ variation.name }
								checked={ selectedValue === variation.name }
								onChange={ () =>
									onSelectVariation( variation.name )
								}
							>
								<Menu.ItemLabel>
									{ variation.title }
								</Menu.ItemLabel>
								{ variation.description && (
									<Menu.ItemHelpText>
										{ variation.description }
									</Menu.ItemHelpText>
								) }
							</Menu.RadioItem>
						) ) }
					</Menu.Group>
				</Menu.Popover>
			</Menu>
		</div>
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
	const { activeBlockVariation, variations, isContentOnly, isSection } =
		useSelect(
			( select ) => {
				const { getActiveBlockVariation, getBlockVariations } =
					select( blocksStore );

				const {
					getBlockName,
					getBlockAttributes,
					getBlockEditingMode,
					isSectionBlock,
				} = unlock( select( blockEditorStore ) );

				const name = blockClientId && getBlockName( blockClientId );

				const { hasContentRoleAttribute } = unlock(
					select( blocksStore )
				);
				const isContentBlock = hasContentRoleAttribute( name );

				return {
					activeBlockVariation: getActiveBlockVariation(
						name,
						getBlockAttributes( blockClientId ),
						'transform'
					),
					variations: name && getBlockVariations( name, 'transform' ),
					isContentOnly:
						getBlockEditingMode( blockClientId ) ===
							'contentOnly' && ! isContentBlock,
					isSection: isSectionBlock( blockClientId ),
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

	const hideVariationsForSections =
		window?.__experimentalContentOnlyPatternInsertion && isSection;

	if ( ! variations?.length || isContentOnly || hideVariationsForSections ) {
		return null;
	}

	const baseClass = 'block-editor-block-variation-transforms';

	// Show buttons if there are more than 6 variations because the ToggleGroupControl does not wrap
	const showButtons = variations.length > 6;

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
