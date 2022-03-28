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
		<VisuallyHidden as="label">{ label }</VisuallyHidden>
	) : (
		<StyledLabel>{ label }</StyledLabel>
	);
};

const BorderControl = (
	props: WordPressComponentProps< BorderControlProps, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		colors,
		disableCustomColors,
		enableAlpha,
		enableStyle = true,
		hideLabelFromVision,
		innerWrapperClassName,
		label,
		onBorderChange,
		onSliderChange,
		onWidthChange,
		placeholder,
		popoverContentClassName,
		previousStyleSelection,
		showDropdownHeader,
		sliderClassName,
		value: border,
		widthControlClassName,
		widthUnit,
		widthValue,
		withSlider,
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		...otherProps
	} = useBorderControl( props );

	return (
		<View { ...otherProps } ref={ forwardedRef }>
			<BorderLabel
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
			/>
			<HStack spacing={ 3 }>
				<HStack className={ innerWrapperClassName } alignment="stretch">
					<BorderControlDropdown
						border={ border }
						colors={ colors }
						contentClassName={ popoverContentClassName }
						disableCustomColors={ disableCustomColors }
						enableAlpha={ enableAlpha }
						enableStyle={ enableStyle }
						onChange={ onBorderChange }
						previousStyleSelection={ previousStyleSelection }
						showDropdownHeader={ showDropdownHeader }
						__experimentalHasMultipleOrigins={
							__experimentalHasMultipleOrigins
						}
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
					/>
					<UnitControl
						className={ widthControlClassName }
						min={ 0 }
						onChange={ onWidthChange }
						value={ border?.width || '' }
						placeholder={ placeholder }
					/>
				</HStack>
				{ withSlider && (
					<RangeControl
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

const ConnectedBorderControl = contextConnect( BorderControl, 'BorderControl' );

export default ConnectedBorderControl;
