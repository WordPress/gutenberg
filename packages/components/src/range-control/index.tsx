/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ChangeEvent, FocusEvent, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useRef, useState, forwardRef } from '@wordpress/element';
import { useInstanceId, useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import Icon from '../icon';
import { COLORS } from '../utils';
import { floatClamp, useControlledRangeValue } from './utils';
import { clamp } from '../utils/math';
import InputRange from './input-range';
import RangeRail from './rail';
import SimpleTooltip from './tooltip';
import {
	ActionRightWrapper,
	AfterIconWrapper,
	BeforeIconWrapper,
	InputNumber,
	Root,
	Track,
	ThumbWrapper,
	Thumb,
	Wrapper,
} from './styles/range-control-styles';

import type { RangeControlProps } from './types';
import type { WordPressComponentProps } from '../context';
import { space } from '../utils/space';

const noop = () => {};

function UnforwardedRangeControl(
	props: WordPressComponentProps< RangeControlProps, 'input', false >,
	forwardedRef: ForwardedRef< HTMLInputElement >
) {
	const {
		__nextHasNoMarginBottom = false,
		afterIcon,
		allowReset = false,
		beforeIcon,
		className,
		color: colorProp = COLORS.theme.accent,
		currentInput,
		disabled = false,
		help,
		hideLabelFromVision = false,
		initialPosition,
		isShiftStepEnabled = true,
		label,
		marks = false,
		max = 100,
		min = 0,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onMouseLeave = noop,
		onMouseMove = noop,
		railColor,
		renderTooltipContent = ( v ) => v,
		resetFallbackValue,
		__next40pxDefaultSize = false,
		shiftStep = 10,
		showTooltip: showTooltipProp,
		step = 1,
		trackColor,
		value: valueProp,
		withInputField = true,
		...otherProps
	} = props;

	const [ value, setValue ] = useControlledRangeValue( {
		min,
		max,
		value: valueProp ?? null,
		initial: initialPosition,
	} );
	const isResetPendent = useRef( false );

	let hasTooltip = showTooltipProp;
	let hasInputField = withInputField;

	if ( step === 'any' ) {
		// The tooltip and number input field are hidden when the step is "any"
		// because the decimals get too lengthy to fit well.
		hasTooltip = false;
		hasInputField = false;
	}

	const [ showTooltip, setShowTooltip ] = useState( hasTooltip );
	const [ isFocused, setIsFocused ] = useState( false );

	const inputRef = useRef< HTMLInputElement >();
	const isCurrentlyFocused = inputRef.current?.matches( ':focus' );
	const isThumbFocused = ! disabled && isFocused;

	const isValueReset = value === null;
	const currentValue = value !== undefined ? value : currentInput;

	const inputSliderValue = isValueReset ? '' : currentValue;
	const rangeFillValue = isValueReset ? ( max - min ) / 2 + min : value;

	const fillValue = isValueReset
		? 50
		: ( ( value - min ) / ( max - min ) ) * 100;
	const fillValueOffset = `${ clamp( fillValue, 0, 100 ) }%`;

	const classes = clsx( 'components-range-control', className );

	const wrapperClasses = clsx(
		'components-range-control__wrapper',
		!! marks && 'is-marked'
	);

	const id = useInstanceId(
		UnforwardedRangeControl,
		'inspector-range-control'
	);
	const describedBy = !! help ? `${ id }__help` : undefined;
	const enableTooltip = hasTooltip !== false && Number.isFinite( value );

	const handleOnRangeChange = ( event: ChangeEvent< HTMLInputElement > ) => {
		const nextValue = parseFloat( event.target.value );
		setValue( nextValue );
		onChange( nextValue );
	};

	const handleOnChange = ( next?: string ) => {
		// @ts-expect-error TODO: Investigate if it's problematic for setValue() to
		// potentially receive a NaN when next is undefined.
		let nextValue = parseFloat( next );
		setValue( nextValue );

		/*
		 * Calls onChange only when nextValue is numeric
		 * otherwise may queue a reset for the blur event.
		 */
		if ( ! isNaN( nextValue ) ) {
			if ( nextValue < min || nextValue > max ) {
				nextValue = floatClamp( nextValue, min, max ) as number;
			}

			onChange( nextValue );
			isResetPendent.current = false;
		} else if ( allowReset ) {
			isResetPendent.current = true;
		}
	};

	const handleOnInputNumberBlur = () => {
		if ( isResetPendent.current ) {
			handleOnReset();
			isResetPendent.current = false;
		}
	};

	const handleOnReset = () => {
		let resetValue: number | null = parseFloat( `${ resetFallbackValue }` );
		let onChangeResetValue: number | undefined = resetValue;

		if ( isNaN( resetValue ) ) {
			resetValue = null;
			onChangeResetValue = undefined;
		}

		setValue( resetValue );

		/**
		 * Previously, this callback would always receive undefined as
		 * an argument. This behavior is unexpected, specifically
		 * when resetFallbackValue is defined.
		 *
		 * The value of undefined is not ideal. Passing it through
		 * to internal <input /> elements would change it from a
		 * controlled component to an uncontrolled component.
		 *
		 * For now, to minimize unexpected regressions, we're going to
		 * preserve the undefined callback argument, except when a
		 * resetFallbackValue is defined.
		 */
		onChange( onChangeResetValue );
	};

	const handleShowTooltip = () => setShowTooltip( true );
	const handleHideTooltip = () => setShowTooltip( false );

	const handleOnBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		onBlur( event );
		setIsFocused( false );
		handleHideTooltip();
	};

	const handleOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
		onFocus( event );
		setIsFocused( true );
		handleShowTooltip();
	};

	const offsetStyle = {
		[ isRTL() ? 'right' : 'left' ]: fillValueOffset,
	};
	return (
		<BaseControl
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			className={ classes }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ `${ id }` }
			help={ help }
		>
			<Root
				className="components-range-control__root"
				__next40pxDefaultSize={ __next40pxDefaultSize }
			>
				{ beforeIcon && (
					<BeforeIconWrapper>
						<Icon icon={ beforeIcon } />
					</BeforeIconWrapper>
				) }
				<Wrapper
					__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
					className={ wrapperClasses }
					color={ colorProp }
					marks={ !! marks }
				>
					<InputRange
						{ ...otherProps }
						className="components-range-control__slider"
						describedBy={ describedBy }
						disabled={ disabled }
						id={ `${ id }` }
						label={ label }
						max={ max }
						min={ min }
						onBlur={ handleOnBlur }
						onChange={ handleOnRangeChange }
						onFocus={ handleOnFocus }
						onMouseMove={ onMouseMove }
						onMouseLeave={ onMouseLeave }
						ref={ useMergeRefs( [ inputRef, forwardedRef ] ) }
						step={ step }
						value={ inputSliderValue ?? undefined }
					/>
					<RangeRail
						aria-hidden
						disabled={ disabled }
						marks={ marks }
						max={ max }
						min={ min }
						railColor={ railColor }
						step={ step }
						value={ rangeFillValue }
					/>
					<Track
						aria-hidden
						className="components-range-control__track"
						disabled={ disabled }
						style={ { width: fillValueOffset } }
						trackColor={ trackColor }
					/>
					<ThumbWrapper
						className="components-range-control__thumb-wrapper"
						style={ offsetStyle }
						disabled={ disabled }
					>
						<Thumb
							aria-hidden
							isFocused={ isThumbFocused }
							disabled={ disabled }
						/>
					</ThumbWrapper>
					{ enableTooltip && (
						<SimpleTooltip
							className="components-range-control__tooltip"
							inputRef={ inputRef }
							tooltipPosition="bottom"
							renderTooltipContent={ renderTooltipContent }
							show={ isCurrentlyFocused || showTooltip }
							style={ offsetStyle }
							value={ value }
						/>
					) }
				</Wrapper>
				{ afterIcon && (
					<AfterIconWrapper>
						<Icon icon={ afterIcon } />
					</AfterIconWrapper>
				) }
				{ hasInputField && (
					<InputNumber
						aria-label={ label }
						className="components-range-control__number"
						disabled={ disabled }
						inputMode="decimal"
						isShiftStepEnabled={ isShiftStepEnabled }
						max={ max }
						min={ min }
						onBlur={ handleOnInputNumberBlur }
						onChange={ handleOnChange }
						shiftStep={ shiftStep }
						size={
							__next40pxDefaultSize
								? '__unstable-large'
								: 'default'
						}
						__unstableInputWidth={
							__next40pxDefaultSize ? space( 20 ) : space( 16 )
						}
						step={ step }
						// @ts-expect-error TODO: Investigate if the `null` value is necessary
						value={ inputSliderValue }
					/>
				) }
				{ allowReset && (
					<ActionRightWrapper>
						<Button
							className="components-range-control__reset"
							disabled={ disabled || value === undefined }
							variant="secondary"
							size="small"
							onClick={ handleOnReset }
						>
							{ __( 'Reset' ) }
						</Button>
					</ActionRightWrapper>
				) }
			</Root>
		</BaseControl>
	);
}

/**
 * RangeControls are used to make selections from a range of incremental values.
 *
 * ```jsx
 * import { RangeControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyRangeControl = () => {
 *   const [ isChecked, setChecked ] = useState( true );
 *   return (
 *     <RangeControl
 *       help="Please select how transparent you would like this."
 *       initialPosition={50}
 *       label="Opacity"
 *       max={100}
 *       min={0}
 *       onChange={() => {}}
 *     />
 *   );
 * };
 * ```
 */
export const RangeControl = forwardRef( UnforwardedRangeControl );

export default RangeControl;
