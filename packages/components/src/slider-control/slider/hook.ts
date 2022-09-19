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
import { useControlledValue, useCx } from '../../utils/hooks';
import { useDebouncedHoverInteraction } from '../utils';
import { interpolate } from '../../utils/interpolate';
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
		onHideTooltip = noop,
		onMouseLeave = noop,
		onMouseMove = noop,
		onShowTooltip = noop,
		isFocused: isFocusedProp = false,
		max = 100,
		min = 0,
		size = 'default',
		style,
		thumbColor = COLORS.ui.theme,
		trackColor = COLORS.ui.theme,
		trackBackgroundColor = CONFIG.controlBackgroundDimColor,
		value: valueProp,
		...otherProps
	} = useContextSystem( props, 'Slider' );

	const numericMax = parseFloat( `${ max }` );
	const numericMin = parseFloat( `${ min }` );
	const fallbackDefaultValue = ( numericMax - numericMin ) / 2 + numericMin;

	const [ value, onChange ] = useControlledValue( {
		defaultValue: defaultValue || fallbackDefaultValue,
		onChange: onChangeProp,
		value: valueProp,
	} );

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

			onChange( nextValue );
		},
		[ onChange ]
	);

	const handleOnFocus = useCallback(
		( event ) => {
			onFocus( event );
			setIsFocused( true );
		},
		[ onFocus ]
	);

	const hoverInteractions = useDebouncedHoverInteraction( {
		onHide: onHideTooltip,
		onMouseLeave,
		onMouseMove,
		onShow: onShowTooltip,
	} );

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
			styles.slider(
				{ thumbColor, trackColor, trackBackgroundColor },
				size
			),
			error && styles.error( { errorColor, trackBackgroundColor } ),
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
		...hoverInteractions,
		className: classes,
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
