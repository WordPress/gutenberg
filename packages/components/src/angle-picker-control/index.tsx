/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Flex, FlexBlock } from '../flex';
import { Spacer } from '../spacer';
import NumberControl from '../number-control';
import AngleCircle from './angle-circle';
import { UnitText } from './styles/angle-picker-control-styles';

import type { WordPressComponentProps } from '../context';
import type { AnglePickerControlProps } from './types';

function UnforwardedAnglePickerControl(
	props: WordPressComponentProps< AnglePickerControlProps, 'div' >,
	ref: ForwardedRef< any >
) {
	const {
		className,
		label = __( 'Angle' ),
		onChange,
		value,
		...restProps
	} = props;

	const handleOnNumberChange = ( unprocessedValue: string | undefined ) => {
		if ( onChange === undefined ) {
			return;
		}

		const inputValue =
			unprocessedValue !== undefined && unprocessedValue !== ''
				? parseInt( unprocessedValue, 10 )
				: 0;
		onChange( inputValue );
	};

	const classes = clsx( 'components-angle-picker-control', className );

	const unitText = <UnitText>°</UnitText>;
	const [ prefixedUnitText, suffixedUnitText ] = isRTL()
		? [ unitText, null ]
		: [ null, unitText ];

	return (
		<Flex { ...restProps } ref={ ref } className={ classes } gap={ 2 }>
			<FlexBlock>
				<NumberControl
					label={ label }
					className="components-angle-picker-control__input-field"
					max={ 360 }
					min={ 0 }
					onChange={ handleOnNumberChange }
					size="__unstable-large"
					step="1"
					value={ value }
					spinControls="none"
					prefix={ prefixedUnitText }
					suffix={ suffixedUnitText }
				/>
			</FlexBlock>
			<Spacer marginBottom="1" marginTop="auto">
				<AngleCircle
					aria-hidden="true"
					value={ value }
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
 *     </>
 *   );
 * }
 * ```
 */
export const AnglePickerControl = forwardRef( UnforwardedAnglePickerControl );

export default AnglePickerControl;
