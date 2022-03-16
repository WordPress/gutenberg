/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * WordPress dependencies
 */
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
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useBorderControlDropdown } from './hook';
import { StyledLabel } from '../../base-control/styles/base-control-styles';

import type {
	Color,
	ColorOrigin,
	Colors,
	DropdownProps,
	PopoverProps,
} from '../types';

const noop = () => undefined;
const getColorObject = (
	colorValue: CSSProperties[ 'borderColor' ],
	colors: Colors | undefined,
	hasMultipleColorOrigins: boolean
) => {
	if ( ! colorValue || ! colors ) {
		return;
	}

	if ( hasMultipleColorOrigins ) {
		let matchedColor;

		( colors as ColorOrigin[] ).some( ( origin ) =>
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

	return ( colors as Color[] ).find(
		( color ) => color.color === colorValue
	);
};

const getToggleAriaLabel = (
	colorValue: CSSProperties[ 'borderColor' ],
	colorObject: Color | undefined,
	style: CSSProperties[ 'borderStyle' ],
	isStyleEnabled: boolean
) => {
	if ( isStyleEnabled ) {
		if ( colorObject ) {
			return style
				? sprintf(
						// translators: %1$s: The name of the color e.g. "vivid red". %2$s: The color's hex code e.g.: "#f00:". %3$s: The current border style selection e.g. "solid".
						'Border color and style picker. The currently selected color is called "%1$s" and has a value of "%2$s". The currently selected style is "%3$s".',
						colorObject.name,
						colorObject.color,
						style
				  )
				: sprintf(
						// translators: %1$s: The name of the color e.g. "vivid red". %2$s: The color's hex code e.g.: "#f00:".
						'Border color and style picker. The currently selected color is called "%1$s" and has a value of "%2$s".',
						colorObject.name,
						colorObject.color
				  );
		}

		if ( colorValue ) {
			return style
				? sprintf(
						// translators: %1$s: The color's hex code e.g.: "#f00:". %2$s: The current border style selection e.g. "solid".
						'Border color and style picker. The currently selected color has a value of "%1$s". The currently selected style is "%2$s".',
						colorValue,
						style
				  )
				: sprintf(
						// translators: %1$s: The color's hex code e.g.: "#f00:".
						'Border color and style picker. The currently selected color has a value of "%1$s".',
						colorValue
				  );
		}

		return __( 'Border color and style picker.' );
	}

	if ( colorObject ) {
		return sprintf(
			// translators: %1$s: The name of the color e.g. "vivid red". %2$s: The color's hex code e.g.: "#f00:".
			'Border color picker. The currently selected color is called "%1$s" and has a value of "%2$s".',
			colorObject.name,
			colorObject.color
		);
	}

	if ( colorValue ) {
		return sprintf(
			// translators: %1$s: The color's hex code e.g.: "#f00:".
			'Border color picker. The currently selected color has a value of "%1$s".',
			colorValue
		);
	}

	return __( 'Border color picker.' );
};

const BorderControlDropdown = (
	props: WordPressComponentProps< DropdownProps, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		border,
		colors,
		disableCustomColors,
		enableAlpha,
		indicatorClassName,
		indicatorWrapperClassName,
		onReset,
		onColorChange,
		onStyleChange,
		popoverClassName,
		popoverContentClassName,
		popoverControlsClassName,
		resetButtonClassName,
		enableStyle = true,
		...otherProps
	} = useBorderControlDropdown( props );

	const { color, style } = border || {};
	const colorObject = getColorObject(
		color,
		colors,
		!! __experimentalHasMultipleOrigins
	);

	const toggleAriaLabel = getToggleAriaLabel(
		color,
		colorObject,
		style,
		enableStyle
	);

	const renderToggle = ( { onToggle = noop } ) => (
		<Button
			onClick={ onToggle }
			variant="tertiary"
			aria-label={ toggleAriaLabel }
		>
			<span className={ indicatorWrapperClassName }>
				<ColorIndicator
					className={ indicatorClassName }
					colorValue={ color }
				/>
			</span>
		</Button>
	);

	const renderContent = ( { onClose }: PopoverProps ) => (
		<>
			<VStack className={ popoverControlsClassName } spacing={ 6 }>
				<HStack>
					<StyledLabel>{ __( 'Border color' ) }</StyledLabel>
					<Button
						isSmall
						label={ __( 'Close border color' ) }
						icon={ closeSmall }
						onClick={ onClose }
					/>
				</HStack>
				<ColorPalette
					className={ popoverContentClassName }
					value={ color }
					onChange={ onColorChange }
					{ ...{ colors, disableCustomColors } }
					__experimentalHasMultipleOrigins={
						__experimentalHasMultipleOrigins
					}
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
			<Button
				className={ resetButtonClassName }
				variant="tertiary"
				onClick={ () => {
					onReset();
					onClose();
				} }
			>
				{ __( 'Reset to default' ) }
			</Button>
		</>
	);

	return (
		<Dropdown
			renderToggle={ renderToggle }
			renderContent={ renderContent }
			contentClassName={ popoverClassName }
			{ ...otherProps }
			ref={ forwardedRef }
		/>
	);
};

const ConnectedBorderControlDropdown = contextConnect(
	BorderControlDropdown,
	'BorderControlDropdown'
);

export default ConnectedBorderControlDropdown;
