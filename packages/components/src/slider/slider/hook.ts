/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useFormGroupContextId } from '../../ui/form-group';
import { useControlledValue, useCx } from '../../utils/hooks';
import { interpolate } from '../../utils/interpolate';
import { parseCSSUnitValue, createCSSUnitValue } from '../../utils/unit-values';
import { isValueNumeric } from '../../utils/values';

import type { SliderProps } from '../types';

const noop = () => {};

export function useSlider(
	props: WordPressComponentProps< SliderProps, 'input', false >
) {
	const {
		className,
		defaultValue,
		error,
		onBlur = noop,
		onChange: onChangeProp = noop,
		onFocus = noop,
		id: idProp,
		isFocused: isFocusedProp = false,
		max = 100,
		min = 0,
		size = 'default',
		style,
		thumbColor,
		trackColor,
		trackBackgroundColor,
		value: valueProp,
		...otherProps
	} = useContextSystem( props, 'Slider' );

	const numericMax = parseFloat( `${ max }` );
	const numericMin = parseFloat( `${ min }` );
	const fallbackDefaultValue = `${ ( numericMax - numericMin ) / 2 }`;

	const [ _value, onChange ] = useControlledValue( {
		defaultValue: defaultValue || fallbackDefaultValue,
		onChange: onChangeProp,
		value: valueProp,
	} );
	const [ value, initialUnit ] = parseCSSUnitValue( `${ _value }` );

	const id = useFormGroupContextId( idProp );
	const [ isFocused, setIsFocused ] = useState( isFocusedProp );

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
			if ( ! isValueNumeric( nextValue ) ) {
				return;
			}

			let next = `${ nextValue }`;

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
		[ numericMin, numericMax ],
		[ 0, 100 ]
	);
	const componentStyles = {
		...style,
		'--slider--progress': `${ currentValue }%`,
	};

	// Generate dynamic class names.
	const cx = useCx();
	const classes = useMemo( () => {
		const colors = { thumbColor, trackColor, trackBackgroundColor };
		return cx(
			styles.slider( colors ),
			error && styles.error,
			styles[ size ],
			isFocused && styles.focused( colors ),
			error && isFocused && styles.focusedError,
			className
		);
	}, [
		className,
		cx,
		error,
		isFocused,
		size,
		thumbColor,
		trackColor,
		trackBackgroundColor,
	] );

	return {
		...otherProps,
		className: classes,
		id: id ? `${ id }` : undefined,
		max,
		min,
		onBlur: handleOnBlur,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		style: componentStyles,
		type: 'range',
		value,
	};
}
