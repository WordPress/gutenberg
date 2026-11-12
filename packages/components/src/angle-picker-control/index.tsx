import type {
	ForwardedRef,
	ForwardRefExoticComponent,
	RefAttributes,
} from 'react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { Flex, FlexBlock } from '../flex';
import { Spacer } from '../spacer';
import NumberControl from '../number-control';
import InputControlPrefixWrapper from '../input-control/input-prefix-wrapper';
import InputControlSuffixWrapper from '../input-control/input-suffix-wrapper';
import AngleCircle from './angle-circle';
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

	const isEmpty = allowEmpty && ( value === undefined || value === '' );

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
					value={ isEmpty ? undefined : ( value ?? 0 ) }
					min={ min }
					max={ max }
					onChange={ onChange }
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
 * With a custom `min` or `max`, the circle works like a knob: dragging changes
 * the angle by how far it turns, past a full turn if the range allows, and
 * stops at `min` and `max`. The circle shows the direction and the text field
 * shows the full angle.
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
) as ForwardRefExoticComponent<
	WordPressComponentProps< AnglePickerControlProps, 'div' > &
		RefAttributes< any >
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
