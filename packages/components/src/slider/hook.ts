/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useCx, useControlledValue } from '../utils/hooks';
import { createCSSUnitValue, parseCSSUnitValue } from '../utils/unit-values';
import { useContextSystem, PolymorphicComponentProps } from '../ui/context';
import type { Props } from './types';

import { useFormGroupContextId } from '../ui/form-group';
import * as styles from './styles';
import { isValueNumeric } from '../utils/values';
import { interpolate } from '../utils/interpolate';

const noop = () => {};

export function useSlider(
	props: PolymorphicComponentProps< Props, 'input', false >
) {
	const {
		className,
		defaultValue,
		hasError,
		onBlur = noop,
		onChange: onChangeProp,
		onFocus = noop,
		id: idProp,
		max = 100,
		min = 0,
		size = 'medium',
		style,
		value: valueProp,
		...otherProps
	} = useContextSystem( props, 'Slider' );

	const [ _value, onChange ] = useControlledValue( {
		value: valueProp,
		onChange: onChangeProp,
		defaultValue: defaultValue || 50,
	} );
	const [ value, initialUnit ] = parseCSSUnitValue( _value.toString() );

	const id = useFormGroupContextId( idProp );
	const [ isFocused, setIsFocused ] = useState( false );

	const handleOnBlur = useCallback(
		( event ) => {
			onBlur( event );
			setIsFocused( false );
		},
		[ onBlur ]
	);

	const handleOnChange = useCallback(
		( event ) => {
			const nextValue = parseFloat( event.target.value );
			if ( ! isValueNumeric( nextValue ) ) return;

			let next: number | string = nextValue;

			if ( initialUnit ) {
				next = createCSSUnitValue( nextValue, initialUnit );
			}

			onChange( next );
		},
		[ onChange, initialUnit ]
	);

	const handleOnFocus = useCallback(
		( event ) => {
			onFocus( event );
			setIsFocused( true );
		},
		[ onFocus ]
	);

	const currentValue = interpolate(
		value,
		[ parseFloat( min.toString() ), parseFloat( max.toString() ) ],
		[ 0, 100 ]
	);
	const componentStyles = {
		...style,
		'--progress': `${ currentValue }%`,
	};

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.Slider,
				hasError && styles.error,
				styles[ size ],
				isFocused && styles.focused,
				hasError && isFocused && styles.focusedError,
				className
			),
		[ className, hasError, isFocused, size ]
	);

	return {
		...otherProps,
		className: classes,
		id,
		max,
		min,
		onBlur: handleOnBlur,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		style: componentStyles,
		type: 'range',
		value,
		'aria-valuemin': min,
		'aria-valuemax': max,
		'aria-valuenow': value,
		'aria-valuetext': createCSSUnitValue( value, initialUnit ),
		role: 'slider',
	};
}
