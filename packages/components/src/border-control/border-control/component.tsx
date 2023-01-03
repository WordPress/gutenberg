/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BorderControlDropdown from '../border-control-dropdown';
import UnitControl from '../../unit-control';
import RangeControl from '../../range-control';
import { HStack } from '../../h-stack';
import { StyledLabel } from '../../base-control/styles/base-control-styles';
import { View } from '../../view';
import { VisuallyHidden } from '../../visually-hidden';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useBorderControl } from './hook';

import type { BorderControlProps, LabelProps } from '../types';

const BorderLabel = ( props: LabelProps ) => {
	const { label, hideLabelFromVision } = props;

	if ( ! label ) {
		return null;
	}

	return hideLabelFromVision ? (
		<VisuallyHidden as="legend">{ label }</VisuallyHidden>
	) : (
		<StyledLabel as="legend">{ label }</StyledLabel>
	);
};

const UnconnectedBorderControl = (
	props: WordPressComponentProps< BorderControlProps, 'div', false >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		colors,
		disableCustomColors,
		disableUnits,
		enableAlpha,
		enableStyle,
		hideLabelFromVision,
		innerWrapperClassName,
		inputWidth,
		label,
		onBorderChange,
		onSliderChange,
		onWidthChange,
		placeholder,
		__unstablePopoverProps,
		previousStyleSelection,
		showDropdownHeader,
		size,
		sliderClassName,
		value: border,
		widthUnit,
		widthValue,
		withSlider,
		__experimentalIsRenderedInSidebar,
		...otherProps
	} = useBorderControl( props );

	return (
		<View as="fieldset" { ...otherProps } ref={ forwardedRef }>
			<BorderLabel
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
			/>
			<HStack spacing={ 4 } className={ innerWrapperClassName }>
				<UnitControl
					prefix={
						<BorderControlDropdown
							border={ border }
							colors={ colors }
							__unstablePopoverProps={ __unstablePopoverProps }
							disableCustomColors={ disableCustomColors }
							enableAlpha={ enableAlpha }
							enableStyle={ enableStyle }
							onChange={ onBorderChange }
							previousStyleSelection={ previousStyleSelection }
							showDropdownHeader={ showDropdownHeader }
							__experimentalIsRenderedInSidebar={
								__experimentalIsRenderedInSidebar
							}
							size={ size }
						/>
					}
					label={ __( 'Border width' ) }
					hideLabelFromVision
					min={ 0 }
					onChange={ onWidthChange }
					value={ border?.width || '' }
					placeholder={ placeholder }
					disableUnits={ disableUnits }
					__unstableInputWidth={ inputWidth }
					size={ size }
				/>
				{ withSlider && (
					<RangeControl
						__nextHasNoMarginBottom
						label={ __( 'Border width' ) }
						hideLabelFromVision
						className={ sliderClassName }
						initialPosition={ 0 }
						max={ 100 }
						min={ 0 }
						onChange={ onSliderChange }
						step={ [ 'px', '%' ].includes( widthUnit ) ? 1 : 0.1 }
						value={ widthValue || undefined }
						withInputField={ false }
					/>
				) }
			</HStack>
		</View>
	);
};

/**
 * The `BorderControl` brings together internal sub-components which allow users to
 * set the various properties of a border. The first sub-component, a
 * `BorderDropdown` contains options representing border color and style. The
 * border width is controlled via a `UnitControl` and an optional `RangeControl`.
 *
 * Border radius is not covered by this control as it may be desired separate to
 * color, style, and width. For example, the border radius may be absorbed under
 * a "shape" abstraction.
 *
 * ```jsx
 * import { __experimentalBorderControl as BorderControl } from '@wordpress/components';
 * import { __ } from '@wordpress/i18n';
 *
 * const colors = [
 * 	{ name: 'Blue 20', color: '#72aee6' },
 * 	// ...
 * ];
 *
 * const MyBorderControl = () => {
 * 	const [ border, setBorder ] = useState();
 * 	const onChange = ( newBorder ) => setBorder( newBorder );
 *
 * 	return (
 * 		<BorderControl
 * 			colors={ colors }
 * 			label={ __( 'Border' ) }
 * 			onChange={ onChange }
 * 			value={ border }
 * 		/>
 * 	);
 * };
 * ```
 */
export const BorderControl = contextConnect(
	UnconnectedBorderControl,
	'BorderControl'
);

export default BorderControl;
