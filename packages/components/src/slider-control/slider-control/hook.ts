/**
 * External dependencies
 */
import type { FocusEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useControlledRangeValue } from '../utils';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks';

import type { SliderControlProps } from '../types';

const noop = () => {};

export function useSliderControl(
	props: WordPressComponentProps< SliderControlProps, 'input', false >
) {
	const {
		className,
		initialPosition,
		max = 100,
		min = 0,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		showTooltip: showTooltipProp,
		step = 1,
		value: valueProp,
		...otherProps
	} = useContextSystem( props, 'SliderControl' );

	const [ value, setValue ] = useControlledRangeValue( {
		min,
		max,
		value: valueProp ?? null,
		initial: initialPosition,
	} );

	const hasTooltip = step === 'any' ? false : showTooltipProp;
	const [ showTooltip, setShowTooltip ] = useState( hasTooltip );
	const enableTooltip = hasTooltip !== false && Number.isFinite( value );

	const inputRef = useRef< HTMLInputElement >();
	const isCurrentlyFocused = inputRef.current?.matches( ':focus' );

	const handleOnBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		onBlur( event );
		setShowTooltip( false );
	};

	const handleOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
		onFocus( event );
		setShowTooltip( true );
	};

	const handleOnChange = ( next: number ) => {
		setValue( next );
		onChange( next );
	};

	// Generate dynamic class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.sliderControl, className );
	}, [ className, cx ] );
	const wrapperClassName = useMemo( () => {
		return cx( styles.sliderWrapper, className );
	}, [ cx ] );

	return {
		...otherProps,
		className: classes,
		enableTooltip,
		inputRef,
		max,
		min,
		onBlur: handleOnBlur,
		onChange: handleOnChange,
		onFocus: handleOnFocus,
		showTooltip: isCurrentlyFocused || showTooltip,
		step,
		value,
		wrapperClassName,
	};
}
