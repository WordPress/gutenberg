/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	Fragment,
	useCallback,
	useMemo,
	useState,
	forwardRef,
} from '@wordpress/element';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import Dropdown from '../dropdown';
import CircularOptionPicker, {
	getComputeCircularOptionPickerCommonProps,
} from '../circular-option-picker';
import { ColorHeading } from './styles';
import type {
	ColorPaletteInternalProps,
	ColorPaletteProps,
	CustomColorPickerDropdownProps,
	MultiplePalettesProps,
	PaletteObject,
	SinglePaletteProps,
} from './types';
import { colorEditingKey } from './private-keys';
import type { WordPressComponentProps } from '../context';
import type { DropdownProps } from '../dropdown/types';
import {
	CUSTOM_PALETTE_SLUG,
	extractColorNameFromCurrentValue,
	isMultiplePaletteArray,
	isSimpleCSSColor,
	normalizeColorValue,
	toColorObjects,
	toPaletteObjects,
} from './utils';
import { AddCustomColorButton } from './color-editing-controls';
import { CustomColorPickerContent, InfoArea } from './color-editing-ui';
import { useColorEditing } from './use-color-editing';

function SinglePalette( {
	className,
	clearColor,
	colors,
	onChange,
	value,
	selectedSlug,
	addAction,
	...additionalProps
}: SinglePaletteProps ) {
	const colorOptions = useMemo( () => {
		const options = colors.map( ( { color, name, slug }, index ) => {
			const colordColor = colord( color );
			const isSelected = selectedSlug
				? slug === selectedSlug
				: value === color;

			return (
				<CircularOptionPicker.Option
					key={ slug ?? `${ color }-${ index }` }
					isSelected={ isSelected }
					selectedIconProps={
						isSelected
							? {
									fill:
										colordColor.contrast() >
										colordColor.contrast( '#000' )
											? '#fff'
											: '#000',
							  }
							: {}
					}
					tooltipText={
						name ||
						// translators: %s: color hex code e.g: "#f00".
						sprintf( __( 'Color code: %s' ), color )
					}
					style={ { backgroundColor: color, color } }
					onClick={
						isSelected
							? clearColor
							: () => onChange( color, index, slug )
					}
				/>
			);
		} );
		if ( addAction ) {
			// Wrap the add action in a Fragment so it doesn't break the listbox structure and reachable by the keyboard.
			options.push(
				<Fragment key="__add-custom-color">{ addAction }</Fragment>
			);
		}
		return options;
	}, [ colors, value, selectedSlug, onChange, clearColor, addAction ] );

	return (
		<CircularOptionPicker.OptionGroup
			className={ className }
			options={ colorOptions }
			{ ...additionalProps }
		/>
	);
}

function MultiplePalettes( {
	className,
	clearColor,
	colors,
	onChange,
	value,
	selectedSlug,
	headingLevel,
	canAddCustomColor,
	onAddCustom,
}: MultiplePalettesProps ) {
	const instanceId = useInstanceId( MultiplePalettes, 'color-palette' );

	if ( colors.length === 0 ) {
		return null;
	}

	return (
		<Stack direction="column" gap="md" className={ className }>
			{ colors.map(
				(
					{ name, slug: paletteSlug, colors: colorPalette },
					index
				) => {
					const id = `${ instanceId }-${ index }`;
					const isCustomPalette = paletteSlug === CUSTOM_PALETTE_SLUG;
					return (
						<Stack
							direction="column"
							gap="sm"
							key={ paletteSlug ?? name ?? index }
						>
							<ColorHeading id={ id } level={ headingLevel }>
								{ name }
							</ColorHeading>
							<SinglePalette
								clearColor={ clearColor }
								colors={ colorPalette }
								onChange={ ( newColor, _colorIndex, slug ) =>
									onChange( newColor, index, slug )
								}
								value={ value }
								selectedSlug={ selectedSlug }
								aria-labelledby={ id }
								addAction={
									isCustomPalette &&
									canAddCustomColor &&
									onAddCustom ? (
										<AddCustomColorButton
											onClick={ onAddCustom }
										/>
									) : undefined
								}
							/>
						</Stack>
					);
				}
			) }
		</Stack>
	);
}

export function CustomColorPickerDropdown( {
	isRenderedInSidebar,
	popoverProps: receivedPopoverProps,
	...props
}: CustomColorPickerDropdownProps ) {
	const popoverProps = useMemo< DropdownProps[ 'popoverProps' ] >(
		() => ( {
			shift: true,
			// Disabling resize as it would otherwise cause the popover to show
			// scrollbars while dragging the color picker's handle close to the
			// popover edge.
			resize: false,
			focusOnMount: 'firstElement',
			...( isRenderedInSidebar
				? {
						// When in the sidebar: open to the left (stacking),
						// leaving the same gap as the parent popover.
						placement: 'left-start',
						offset: 34,
				  }
				: {
						// Default behavior: open below the anchor
						placement: 'bottom',
						offset: 8,
				  } ),
			...receivedPopoverProps,
		} ),
		[ isRenderedInSidebar, receivedPopoverProps ]
	);

	return (
		<Dropdown
			contentClassName="components-color-palette__custom-color-dropdown-content"
			popoverProps={ popoverProps }
			{ ...props }
		/>
	);
}

function UnforwardedColorPalette(
	props: WordPressComponentProps< ColorPaletteProps, 'div' >,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	const {
		asButtons,
		loop,
		clearable = true,
		colors = [],
		disableCustomColors = false,
		enableAlpha = false,
		onChange,
		value,
		selectedSlug,
		__experimentalIsRenderedInSidebar = false,
		headingLevel = 2,
		[ colorEditingKey ]: colorEditing,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		...additionalProps
	} = props as ColorPaletteInternalProps;
	const [ normalizedColorValue, setNormalizedColorValue ] = useState( value );

	const clearColor = useCallback( () => onChange( undefined ), [ onChange ] );

	const customColorPaletteCallbackRef = useCallback(
		( node: HTMLElement | null ) => {
			setNormalizedColorValue( normalizeColorValue( value, node ) );
		},
		[ value ]
	);

	const hasMultipleColorOrigins = isMultiplePaletteArray( colors );
	const buttonLabelName = useMemo(
		() =>
			extractColorNameFromCurrentValue(
				value,
				colors,
				hasMultipleColorOrigins,
				selectedSlug
			),
		[ value, colors, hasMultipleColorOrigins, selectedSlug ]
	);

	const isHex = !! value?.startsWith( '#' );

	// Leave hex values as-is. Remove the `var()` wrapper from CSS vars.
	const displayValue = value?.replace( /^var\((.+)\)$/, '$1' );

	const resolvedColorValue =
		value && isSimpleCSSColor( value ) ? value : normalizedColorValue;

	const editing = useColorEditing( {
		colorEditing,
		value,
		selectedSlug,
		colors,
		disableCustomColors,
		onChange,
		displayValue,
		isHex,
		buttonLabelName,
		resolvedColorValue,
	} );

	const customColorAccessibleLabel = !! displayValue
		? sprintf(
				// translators: 1: The name of the color e.g: "vivid red". 2: The color's hex code e.g: "#f00".
				__(
					'Custom color picker. The currently selected color is called "%1$s" and has a value of "%2$s".'
				),
				buttonLabelName,
				displayValue
		  )
		: __( 'Custom color picker' );

	const paletteCommonProps = {
		clearColor,
		onChange,
		value,
		selectedSlug,
	};

	const actions = !! clearable && (
		<CircularOptionPicker.ButtonAction
			onClick={ clearColor }
			accessibleWhenDisabled
			disabled={ ! value }
		>
			{ __( 'Clear' ) }
		</CircularOptionPicker.ButtonAction>
	);

	const { metaProps, labelProps } = getComputeCircularOptionPickerCommonProps(
		asButtons,
		loop,
		ariaLabel,
		ariaLabelledby
	);

	const shouldDisplayMultiplePalettes =
		hasMultipleColorOrigins ||
		( editing.isEditingEnabled && colors.length === 0 );

	const displayedColors = useMemo( () => {
		if ( ! editing.isEditingEnabled || ! shouldDisplayMultiplePalettes ) {
			return colors;
		}

		const palettes = hasMultipleColorOrigins
			? toPaletteObjects( colors )
			: [];
		if (
			! editing.canEditFullCustom ||
			palettes.some( ( palette ) => palette.slug === CUSTOM_PALETTE_SLUG )
		) {
			return palettes;
		}

		return [
			...palettes,
			{
				name: _x(
					'Custom',
					'Indicates this palette is created by the user.'
				),
				slug: CUSTOM_PALETTE_SLUG,
				colors: [],
			},
		];
	}, [
		colors,
		hasMultipleColorOrigins,
		editing.isEditingEnabled,
		editing.canEditFullCustom,
		shouldDisplayMultiplePalettes,
	] );

	const shouldRenderCustomColorPicker = ! disableCustomColors;
	const shouldRenderPalette = displayedColors.length > 0 || !! actions;

	if ( ! shouldRenderCustomColorPicker && ! shouldRenderPalette ) {
		return null;
	}

	// Toggle swatch uses raw `value` so CSS variables (`var(--*)`) paint
	// correctly; the picker uses `resolvedColorValue` (computed hex when needed).
	const toggleSwatchBackground =
		editing.editingState.mode === 'edit'
			? editing.editingState.previewColor ?? value
			: value;

	return (
		<Stack
			direction="column"
			gap="md"
			ref={ forwardedRef }
			{ ...additionalProps }
		>
			{ shouldRenderCustomColorPicker && (
				<CustomColorPickerDropdown
					isRenderedInSidebar={ __experimentalIsRenderedInSidebar }
					open={ editing.isPickerOpen }
					onToggle={ editing.setIsPickerOpen }
					renderContent={ () => (
						<CustomColorPickerContent
							color={ editing.editPickerColor }
							enableAlpha={ enableAlpha }
							onPickerChange={ editing.handlePickerChange }
						/>
					) }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Stack
							className="components-color-palette__custom-color-wrapper"
							direction="column"
						>
							<button
								ref={ customColorPaletteCallbackRef }
								className="components-color-palette__custom-color-button"
								aria-expanded={ isOpen }
								aria-haspopup="dialog"
								onClick={ onToggle }
								aria-label={ customColorAccessibleLabel }
								style={ {
									background: toggleSwatchBackground,
								} }
								type="button"
							/>
							<Stack
								className="components-color-palette__custom-color-text-wrapper"
								direction="column"
								gap="xs"
							>
								<InfoArea
									editingState={ editing.editingState }
									displayValue={ displayValue }
									editDisplayHex={ editing.editDisplayHex }
									editingCapability={
										editing.editingCapability
									}
									displayedName={ editing.displayedName }
									isHex={ isHex }
									canEditSelected={ editing.canEditSelected }
									canDeleteSelected={
										editing.canDeleteSelected
									}
									isDirtyCustomValue={
										editing.isDirtyCustomValue
									}
									onEnterAdd={ editing.handleEnterAdd }
									onEnterEdit={ editing.handleEnterEdit }
									onEnterDelete={ editing.handleEnterDelete }
									onCancel={ editing.handleCancel }
									onSubmitAdd={ editing.handleSubmitAdd }
									onSubmitEdit={ editing.handleSubmitEdit }
									onConfirmDelete={
										editing.handleConfirmDelete
									}
								/>
							</Stack>
						</Stack>
					) }
				/>
			) }
			{ shouldRenderPalette && (
				<CircularOptionPicker
					{ ...metaProps }
					{ ...labelProps }
					actions={ actions }
					options={
						shouldDisplayMultiplePalettes ? (
							<MultiplePalettes
								{ ...paletteCommonProps }
								headingLevel={ headingLevel }
								colors={ displayedColors as PaletteObject[] }
								canAddCustomColor={ editing.canEditFullCustom }
								onAddCustom={ editing.handleEnterAdd }
							/>
						) : (
							<SinglePalette
								{ ...paletteCommonProps }
								colors={ toColorObjects( colors ) }
							/>
						)
					}
				/>
			) }
		</Stack>
	);
}

/**
 * Allows the user to pick a color from a list of pre-defined color entries.
 *
 * ```jsx
 * import { ColorPalette } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyColorPalette = () => {
 *   const [ color, setColor ] = useState ( '#f00' )
 *   const colors = [
 *     { name: 'red', color: '#f00' },
 *     { name: 'white', color: '#fff' },
 *     { name: 'blue', color: '#00f' },
 *   ];
 *   return (
 *     <ColorPalette
 *       colors={ colors }
 *       value={ color }
 *       onChange={ ( color ) => setColor( color ) }
 *     />
 *   );
 * } );
 * ```
 */
export const ColorPalette = forwardRef( UnforwardedColorPalette );
ColorPalette.displayName = 'ColorPalette';

export default ColorPalette;
