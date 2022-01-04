/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BorderControlStylePicker from '../border-control-style-picker';
import Button from '../../button';
// @ts-ignore
import ColorIndicator from '../../color-indicator';
// @ts-ignore
import ColorPalette from '../../color-palette';
import Dropdown from '../../dropdown';
import { HStack } from '../../h-stack';
import { VStack } from '../../v-stack';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useBorderControlDropdown } from './hook';
import { StyledLabel } from '../../base-control/styles/base-control-styles';

import type { DropdownProps, PopoverProps } from '../types';
const noop = () => undefined;

const BorderControlDropdown = (
	props: WordPressComponentProps< DropdownProps, 'div' >,
	forwardedRef: React.Ref< any >
) => {
	const {
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		border,
		colors,
		disableCustomColors,
		enableAlpha,
		indicatorClassName,
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
	const fallbackColor = !! style && style !== 'none' ? '#ddd' : undefined;
	const indicatorBorderStyles = {
		// The border style is set to `none` when border width is zero. Forcing
		// the solid style in this case maintains the positioning of the inner
		// ColorIndicator.
		borderStyle: style === 'none' ? 'solid' : style,
		// If there is no color selected but we have a style to display, apply
		// a border color anyway.
		borderColor: color || fallbackColor,
	};

	const renderToggle = ( { onToggle = noop } ) => (
		<Button
			onClick={ onToggle }
			variant="tertiary"
			aria-label={ __( 'Open border options' ) }
		>
			<span style={ indicatorBorderStyles }>
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
