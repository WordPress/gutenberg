/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BorderControlStylePicker from '../border-control-style-picker';
import Button from '../../button';
import ColorIndicator from '../../color-indicator';
import ColorPalette from '../../color-palette';
import Dropdown from '../../dropdown';
import { HStack } from '../../h-stack';
import { VStack } from '../../v-stack';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useBorderControlDropdown } from './hook';
import { StyledLabel } from '../../base-control/styles/base-control-styles';
import DropdownContentWrapper from '../../dropdown/dropdown-content-wrapper';
import { VisuallyHidden } from '../../visually-hidden';
import type { ColorObject } from '../../color-palette/types';
import { isMultiplePaletteArray } from '../../color-palette/utils';
import type { DropdownProps as DropdownComponentProps } from '../../dropdown/types';
import type { ColorProps, DropdownProps } from '../types';

const getAriaDescriptionColorValue = ( colorValue: string ) => {
	// Leave hex values as-is. Remove the `var()` wrapper from CSS vars.
	return colorValue.replace( /^var\((.+)\)$/, '$1' );
};

const getColorObject = (
	colorValue: CSSProperties[ 'borderColor' ],
	colors: ColorProps[ 'colors' ] | undefined
) => {
	if ( ! colorValue || ! colors ) {
		return;
	}

	if ( isMultiplePaletteArray( colors ) ) {
		// Multiple origins
		let matchedColor;

		colors.some( ( origin ) =>
			origin.colors.some( ( color ) => {
				if ( color.color === colorValue ) {
					matchedColor = color;
					return true;
				}

				return false;
			} )
		);

		return matchedColor;
	}

	// Single origin
	return colors.find( ( color ) => color.color === colorValue );
};

const getToggleDescription = (
	colorValue: CSSProperties[ 'borderColor' ],
	colorObject: ColorObject | undefined,
	style: CSSProperties[ 'borderStyle' ],
	isStyleEnabled: boolean
) => {
	if ( isStyleEnabled ) {
		if ( colorObject ) {
			const ariaDescriptionValue = getAriaDescriptionColorValue(
				colorObject.color
			);
			return style
				? sprintf(
						// translators: %1$s: The name of the color e.g. "vivid red". %2$s: The color's hex code e.g.: "#f00:". %3$s: The current border style selection e.g. "solid".
						'The currently selected color is called "%1$s" and has a value of "%2$s". The currently selected style is "%3$s".',
						colorObject.name,
						ariaDescriptionValue,
						style
				  )
				: sprintf(
						// translators: %1$s: The name of the color e.g. "vivid red". %2$s: The color's hex code e.g.: "#f00:".
						'The currently selected color is called "%1$s" and has a value of "%2$s".',
						colorObject.name,
						ariaDescriptionValue
				  );
		}

		if ( colorValue ) {
			const ariaDescriptionValue =
				getAriaDescriptionColorValue( colorValue );
			return style
				? sprintf(
						// translators: %1$s: The color's hex code e.g.: "#f00:". %2$s: The current border style selection e.g. "solid".
						'The currently selected color has a value of "%1$s". The currently selected style is "%2$s".',
						ariaDescriptionValue,
						style
				  )
				: sprintf(
						// translators: %1$s: The color's hex code e.g: "#f00".
						'The currently selected color has a value of "%1$s".',
						ariaDescriptionValue
				  );
		}

		if ( style ) {
			return sprintf(
				// translators: %1$s: The current border style selection e.g. "solid".
				'The currently selected style is "%1$s". No color is selected. Select a color to display the border.',
				style
			);
		}
	}

	if ( colorObject ) {
		return sprintf(
			// translators: %1$s: The name of the color e.g. "vivid red". %2$s: The color's hex code e.g: "#f00".
			'The currently selected color is called "%1$s" and has a value of "%2$s".',
			colorObject.name,
			getAriaDescriptionColorValue( colorObject.color )
		);
	}

	if ( colorValue ) {
		return sprintf(
			// translators: %1$s: The color's hex code e.g: "#f00".
			'The currently selected color has a value of "%1$s".',
			getAriaDescriptionColorValue( colorValue )
		);
	}

	return __( 'Select a border color and style.' );
};

const BorderControlDropdown = (
	props: WordPressComponentProps< DropdownProps, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		__experimentalIsRenderedInSidebar,
		border,
		colors,
		disableCustomColors,
		enableAlpha,
		enableStyle,
		indicatorClassName,
		indicatorWrapperClassName,
		onReset,
		onColorChange,
		onStyleChange,
		popoverContentClassName,
		popoverControlsClassName,
		resetButtonClassName,
		showDropdownHeader,
		__unstablePopoverProps,
		...otherProps
	} = useBorderControlDropdown( props );

	const { color, style } = border || {};
	const colorObject = getColorObject( color, colors );
	const toggleDescriptionId = useInstanceId(
		BorderControlDropdown,
		'border-control-dropdown'
	);

	const toggleDescription = getToggleDescription(
		color,
		colorObject,
		style,
		enableStyle
	);

	const showResetButton = color || ( style && style !== 'none' );
	const dropdownPosition = __experimentalIsRenderedInSidebar
		? 'bottom left'
		: undefined;

	const renderToggleDescribedBy: DropdownComponentProps[ 'renderToggleDescribedBy' ] = () => (
		<VisuallyHidden id={ toggleDescriptionId }>
			{ toggleDescription }
		</VisuallyHidden>
	);

	const renderToggle: DropdownComponentProps[ 'renderToggle' ] = ( {
		onToggle,
	} ) => (
			<Button
				onClick={ onToggle }
				variant="tertiary"
				tooltipPosition={ dropdownPosition }
				label={ __( 'Border color and style picker' ) }
				showTooltip={ true }
				aria-describedby={ toggleDescriptionId }
			>
				<span className={ indicatorWrapperClassName }>
					<ColorIndicator
						className={ indicatorClassName }
						colorValue={ color }
					/>
				</span>
			</Button>
	);

	const renderContent: DropdownComponentProps[ 'renderContent' ] = ( {
		onClose,
	} ) => (
		<>
			<DropdownContentWrapper paddingSize="medium">
				<VStack className={ popoverControlsClassName } spacing={ 6 }>
					{ showDropdownHeader ? (
						<HStack>
							<StyledLabel>{ __( 'Border color' ) }</StyledLabel>
							<Button
								isSmall
								label={ __( 'Close border color' ) }
								icon={ closeSmall }
								onClick={ onClose }
							/>
						</HStack>
					) : undefined }
					<ColorPalette
						className={ popoverContentClassName }
						value={ color }
						onChange={ onColorChange }
						{ ...{ colors, disableCustomColors } }
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
						clearable={ false }
						enableAlpha={ enableAlpha }
					/>
					{ enableStyle && (
						<BorderControlStylePicker
							label={ __( 'Style' ) }
							value={ style }
							onChange={ onStyleChange }
						/>
					) }
				</VStack>
			</DropdownContentWrapper>
			{ showResetButton && (
				<DropdownContentWrapper paddingSize="none">
					<Button
						className={ resetButtonClassName }
						variant="tertiary"
						onClick={ () => {
							onReset();
							onClose();
						} }
					>
						{ __( 'Reset' ) }
					</Button>
				</DropdownContentWrapper>
			) }
		</>
	);

	return (
		<>
			{ renderToggleDescribedBy() }
			<Dropdown
				renderToggle={ renderToggle }
				renderContent={ renderContent }
				popoverProps={ {
					...__unstablePopoverProps,
				} }
				{ ...otherProps }
				ref={ forwardedRef }
			/>
		</>
	);
};

const ConnectedBorderControlDropdown = contextConnect(
	BorderControlDropdown,
	'BorderControlDropdown'
);

export default ConnectedBorderControlDropdown;
