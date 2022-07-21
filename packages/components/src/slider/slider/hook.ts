/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { COLORS, CONFIG } from '../../utils';
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
		errorColor = CONFIG.controlDestructiveBorderColor,
		onBlur = noop,
		onChange: onChangeProp = noop,
		onFocus = noop,
		id: idProp,
		isFocused: isFocusedProp = false,
		max = 100,
		min = 0,
		size = 'default',
		style,
		thumbColor = COLORS.admin.theme,
		trackColor = COLORS.admin.theme,
		trackBackgroundColor = CONFIG.controlBackgroundDimColor,
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

	// Interpolate the current value between 0 and 100, so that it can be used
	// to position the slider's thumb correctly.
	const progressPercentage = interpolate(
		value,
		[ numericMin, numericMax ],
		[ 0, 100 ]
	);
	const componentStyles = {
		...style,
		'--slider--progress': `${ progressPercentage }%`,
	};

	// Generate dynamic class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx(
			styles.slider( { thumbColor, trackColor, trackBackgroundColor } ),
			error && styles.error( { errorColor, trackBackgroundColor } ),
			styles[ size ],
			isFocused && styles.focused( thumbColor ),
			error && isFocused && styles.focusedError( errorColor ),
			className
		);
	}, [
		className,
		cx,
		error,
		errorColor,
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
