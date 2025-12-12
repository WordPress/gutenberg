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
	const {
		activeBlockVariation,
		unfilteredVariations,
		blockName,
		isContentOnly,
		isSection,
	} = useSelect(
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

			const { hasContentRoleAttribute } = unlock( select( blocksStore ) );
			const isContentBlock = hasContentRoleAttribute( name );

			return {
				activeBlockVariation: getActiveBlockVariation(
					name,
					getBlockAttributes( blockClientId ),
					'transform'
				),
				unfilteredVariations:
					name && getBlockVariations( name, 'transform' ),
				blockName: name,
				isContentOnly:
					getBlockEditingMode( blockClientId ) === 'contentOnly' &&
					! isContentBlock,
				isSection: isSectionBlock( blockClientId ),
			};
		},
		[ blockClientId ]
	);

	/*
	 * Hack for WordPress 6.9
	 *
	 * The Stretchy blocks shipped in 6.9 were ultimately
	 * implemented as block variations of the base types Paragraph
	 * and Heading. See #73056 for discussion and trade-offs.
	 *
	 * The main drawback of this choice is that the Variations API
	 * doesn't offer enough control over how prominent and how tied
	 * to the base type a variation should be.
	 *
	 * In order to ship these new "blocks" with an acceptable UX,
	 * we need two hacks until the Variations API is improved:
	 *
	 * - Don't show the variations switcher in the block inspector
	 *   for Paragraph, Heading, Stretchy Paragraph and Stretchy
	 *   Heading (implemented below). Transformations are still
	 *   available in the block switcher.
	 *
	 * - Move the stretchy variations to the end of the core blocks
	 *   list in the block inserter (implemented in
	 *   getInserterItems in #73056).
	 */
	const variations = useMemo( () => {
		if ( blockName === 'core/paragraph' ) {
			// Always hide options when active variation is stretchy, but
			// ensure that there are no third-party variations before doing the
			// same elsewhere.
			if (
				activeBlockVariation?.name === 'stretchy-paragraph' ||
				unfilteredVariations.every( ( v ) =>
					[ 'paragraph', 'stretchy-paragraph' ].includes( v.name )
				)
			) {
				return [];
			}
			// If there are other variations, only hide the stretchy one.
			return unfilteredVariations.filter(
				( v ) => v.name !== 'stretchy-paragraph'
			);
		} else if ( blockName === 'core/heading' ) {
			// Hide variations picker when stretchy-heading is active.
			if ( activeBlockVariation?.name === 'stretchy-heading' ) {
				return [];
			}
			// Filter out stretchy-heading.
			return unfilteredVariations.filter(
				( variation ) => variation.name !== 'stretchy-heading'
			);
		}
		return unfilteredVariations;
	}, [ activeBlockVariation?.name, blockName, unfilteredVariations ] );

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
