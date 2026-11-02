import { store as blocksStore } from '@wordpress/blocks';
import type { ComponentProps, ReactElement } from 'react';
import type {
	BlockTypeIconDescriptor,
	BlockVariation,
} from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	VisuallyHidden,
} from '@wordpress/ui';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type {
	BlockVariationTransformsProps,
	VariationsControlProps,
} from './types';

function VariationsButtons( {
	className,
	onSelectVariation,
	selectedValue,
	variations,
}: VariationsControlProps ) {
	return (
		<fieldset className={ className }>
			<VisuallyHidden render={ <legend /> }>
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
}: VariationsControlProps ) {
	return (
		<div className={ className }>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							className="block-editor-block-variation-transforms__button"
							__next40pxDefaultSize
							variant="secondary"
						/>
					}
				>
					{ __( 'Transform to variation' ) }
				</Menu.Trigger>
				<Menu.Popup
					positioner={
						<Menu.Positioner side="bottom" align="start" />
					}
				>
					<Menu.RadioGroup
						value={ selectedValue ?? null }
						onValueChange={ onSelectVariation }
					>
						{ variations.map( ( variation ) => (
							<Menu.RadioItem
								key={ variation.name }
								value={ variation.name }
							>
								<Menu.ItemLabel>
									{ variation.title }
								</Menu.ItemLabel>
								{
									// An empty description renders nothing.
									( variation.description && (
										<Menu.ItemDescription>
											{ variation.description }
										</Menu.ItemDescription>
									) ) as
										| ReactElement<
												ComponentProps<
													typeof Menu.ItemDescription
												>
										  >
										| undefined
								}
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
		</div>
	);
}

function VariationsToggleGroupControl( {
	className,
	onSelectVariation,
	selectedValue,
	variations,
}: VariationsControlProps ) {
	return (
		<div className={ className }>
			<ToggleGroupControl
				label={ __( 'Transform to variation' ) }
				value={ selectedValue }
				hideLabelFromVision
				// The option values are variation names.
				onChange={
					onSelectVariation as ( value?: string | number ) => void
				}
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

function BlockVariationTransforms( {
	blockClientId,
}: BlockVariationTransformsProps ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const {
		activeBlockVariation,
		variations,
		canEdit,
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
			const { canEditBlock } = select( blockEditorStore );

			const name = blockClientId && getBlockName( blockClientId );

			const { hasContentRoleAttribute } = unlock( select( blocksStore ) );
			const isContentBlock = hasContentRoleAttribute( name );

			return {
				activeBlockVariation: getActiveBlockVariation(
					name,
					getBlockAttributes( blockClientId ),
					'transform'
				),
				variations: name && getBlockVariations( name, 'transform' ),
				canEdit: canEditBlock( blockClientId ),
				isContentOnly:
					getBlockEditingMode( blockClientId ) === 'contentOnly' &&
					! isContentBlock,
				isSection: isSectionBlock( blockClientId ),
			};
		},
		[ blockClientId ]
	);

	const selectedValue = activeBlockVariation?.name;

	// Check if each variation has a unique icon.
	const hasUniqueIcons = useMemo( () => {
		const variationIcons = new Set< unknown >();
		if ( ! variations ) {
			return false;
		}
		variations.forEach( ( variation: BlockVariation ) => {
			if ( variation.icon ) {
				variationIcons.add(
					// A variation icon is a descriptor or the icon itself.
					( variation.icon as unknown as BlockTypeIconDescriptor )
						?.src || variation.icon
				);
			}
		} );
		return variationIcons.size === variations.length;
	}, [ variations ] );

	const onSelectVariation = ( variationName: string ) => {
		updateBlockAttributes( blockClientId, {
			// The selected variation is one of the listed ones.
			...( variations as BlockVariation[] ).find(
				( { name } ) => name === variationName
			)!.attributes,
		} );
	};

	if ( ! variations?.length || ! canEdit || isContentOnly || isSection ) {
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

export default BlockVariationTransforms;
