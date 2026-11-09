import type { ForwardedRef } from 'react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { Flex, FlexBlock } from '../flex';
import { Spacer } from '../spacer';
import NumberControl from '../number-control';
import InputControlPrefixWrapper from '../input-control/input-prefix-wrapper';
import InputControlSuffixWrapper from '../input-control/input-suffix-wrapper';
import AngleCircle from './angle-circle';
import { clamp } from '../utils/math';
import type { WordPressComponentProps } from '../context';
import type {
	AnglePickerControlProps,
	PrivateAnglePickerControlProps,
} from './types';

function UnforwardedAnglePickerControl(
	props: WordPressComponentProps< PrivateAnglePickerControlProps, 'div' >,
	ref: ForwardedRef< any >
) {
	const {
		allowEmpty = false,
		className,
		label = __( 'Angle' ),
		max = 360,
		min = 0,
		onChange,
		value,
		...restProps
	} = props;

	const handleOnNumberChange = ( unprocessedValue: string | undefined ) => {
		if ( onChange === undefined ) {
			return;
		}

		if ( unprocessedValue === undefined || unprocessedValue === '' ) {
			onChange( allowEmpty ? undefined : 0 );
			return;
		}

		onChange( parseInt( unprocessedValue, 10 ) );
	};

	// The dial reports 0 to 359, so shift by a full turn to reach a range
	// such as -180 to 180.
	const handleOnAngleCircleChange = ( angle: number ) => {
		if ( angle > max && angle - 360 >= min ) {
			onChange( angle - 360 );
			return;
		}
		onChange( clamp( angle, min, max ) );
	};

	const classes = clsx( 'components-angle-picker-control', className );

	// Override the default behavior and position the degree symbol to the
	// right of the number, regardless of the language direction.
	const prefixOrSuffixProp = isRTL()
		? { prefix: <InputControlPrefixWrapper>°</InputControlPrefixWrapper> }
		: { suffix: <InputControlSuffixWrapper>°</InputControlSuffixWrapper> };

	return (
		<Flex { ...restProps } ref={ ref } className={ classes } gap={ 2 }>
			<FlexBlock>
				<NumberControl
					label={ label }
					className="components-angle-picker-control__input-field"
					max={ max }
					min={ min }
					onChange={ handleOnNumberChange }
					step="1"
					value={ value }
					spinControls="none"
					{ ...prefixOrSuffixProp }
				/>
			</FlexBlock>
			<Spacer marginBottom="1" marginTop="auto">
				<AngleCircle
					aria-hidden="true"
					value={ value }
					onChange={ handleOnAngleCircleChange }
				/>
			</Spacer>
		</Flex>
	);
}

/**
 * `AnglePickerControl` is a React component to render a UI that allows users to
 * pick an angle. Users can choose an angle in a visual UI with the mouse by
 * dragging an angle indicator inside a circle or by directly inserting the
 * desired angle in a text field.
 *
 * ```jsx
 * import { useState } from '@wordpress/element';
 * import { AnglePickerControl } from '@wordpress/components';
 *
 * function Example() {
 *   const [ angle, setAngle ] = useState( 0 );
 *   return (
 *     <AnglePickerControl
 *       value={ angle }
 *       onChange={ setAngle }
 *     />
 *   );
 * }
 * ```
 */
export const AnglePickerControl = forwardRef(
	UnforwardedAnglePickerControl
) as React.ForwardRefExoticComponent<
	WordPressComponentProps< AnglePickerControlProps, 'div' > &
		React.RefAttributes< any >
>;
AnglePickerControl.displayName = 'AnglePickerControl';

/**
 * `AnglePickerControl` with an `allowEmpty` option, so that clearing the
 * input reports `undefined` instead of `0`.
 */
export const PrivateAnglePickerControl = forwardRef(
	UnforwardedAnglePickerControl
);
PrivateAnglePickerControl.displayName = 'PrivateAnglePickerControl';

export default AnglePickerControl;
