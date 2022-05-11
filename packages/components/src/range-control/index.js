// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp, isFinite, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useRef, useState, forwardRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import Icon from '../icon';
import { COLORS, useControlledState } from '../utils';
import { useUnimpededRangedNumberEntry } from './utils';
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

function RangeControl(
	{
		afterIcon,
		allowReset = false,
		beforeIcon,
		className,
		currentInput,
		color: colorProp = COLORS.ui.theme,
		disabled = false,
		help,
		initialPosition,
		isShiftStepEnabled = true,
		label,
		hideLabelFromVision = false,
		marks = false,
		max = 100,
		min = 0,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onMouseMove = noop,
		onMouseLeave = noop,
		railColor,
		resetFallbackValue,
		renderTooltipContent = ( v ) => v,
		showTooltip: showTooltipProp,
		shiftStep = 10,
		step = 1,
		trackColor,
		value: valueProp,
		withInputField = true,
		...props
	},
	ref
) {
	const isResetPendent = useRef( false );
	const [ value, setValue ] = useControlledState( valueProp, {
		fallback: null,
	} );

	if ( step === 'any' ) {
		// The tooltip and number input field are hidden when the step is "any"
		// because the decimals get too lengthy to fit well.
		showTooltipProp = false;
		withInputField = false;
	}

	const [ showTooltip, setShowTooltip ] = useState( showTooltipProp );
	const [ isFocused, setIsFocused ] = useState( false );

	const inputRef = useRef();

	const setRef = ( nodeRef ) => {
		inputRef.current = nodeRef;

		if ( ref ) {
			ref( nodeRef );
		}
	};

	const isCurrentlyFocused = inputRef.current?.matches( ':focus' );
	const isThumbFocused = ! disabled && isFocused;

	const isValueReset = value === null;
	const usedValue = isValueReset
		? resetFallbackValue ?? initialPosition
		: value ?? currentInput;

	const fillPercent = `${
		usedValue === null || usedValue === undefined
			? 50
			: ( ( clamp( usedValue, min, max ) - min ) / ( max - min ) ) * 100
	}%`;

	const classes = classnames( 'components-range-control', className );

	const wrapperClasses = classnames(
		'components-range-control__wrapper',
		!! marks && 'is-marked'
	);

	const id = useInstanceId( RangeControl, 'inspector-range-control' );
	const describedBy = !! help ? `${ id }__help` : undefined;
	const enableTooltip = showTooltipProp !== false && isFinite( value );

	const handleOnRangeChange = ( event ) => {
		const nextValue = parseFloat( event.target.value );
		setValue( nextValue );
		onChange( nextValue );
	};

	const someNumberInputProps = useUnimpededRangedNumberEntry( {
		max,
		min,
		value: usedValue ?? '',
		onChange: ( nextValue ) => {
			if ( ! isNaN( nextValue ) ) {
				setValue( nextValue );
				onChange( nextValue );
				isResetPendent.current = false;
			} else if ( allowReset ) {
				isResetPendent.current = true;
			}
		},
	} );

	const handleOnInputNumberBlur = () => {
		if ( isResetPendent.current ) {
			handleOnReset();
			isResetPendent.current = false;
		}
	};

	const handleOnReset = () => {
		const resetValue = parseFloat( resetFallbackValue );

		if ( isNaN( resetValue ) ) {
			setValue( null );
			/*
			 * If the value is reset without a resetFallbackValue, the onChange
			 * callback receives undefined as that was the behavior when the
			 * component was stablized.
			 */
			onChange( undefined );
		} else {
			setValue( resetValue );
			onChange( resetValue );
		}
	};

	const handleShowTooltip = () => setShowTooltip( true );
	const handleHideTooltip = () => setShowTooltip( false );

	const handleOnBlur = ( event ) => {
		onBlur( event );
		setIsFocused( false );
		handleHideTooltip();
	};

	const handleOnFocus = ( event ) => {
		onFocus( event );
		setIsFocused( true );
		handleShowTooltip();
	};

	const offsetStyle = {
		[ isRTL() ? 'right' : 'left' ]: fillPercent,
	};

	return (
		<BaseControl
			className={ classes }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
		>
			<Root className="components-range-control__root">
				{ beforeIcon && (
					<BeforeIconWrapper>
						<Icon icon={ beforeIcon } />
					</BeforeIconWrapper>
				) }
				<Wrapper
					className={ wrapperClasses }
					color={ colorProp }
					marks={ !! marks }
				>
					<InputRange
						{ ...props }
						className="components-range-control__slider"
						describedBy={ describedBy }
						disabled={ disabled }
						id={ id }
						label={ label }
						max={ max }
						min={ min }
						onBlur={ handleOnBlur }
						onChange={ handleOnRangeChange }
						onFocus={ handleOnFocus }
						onMouseMove={ onMouseMove }
						onMouseLeave={ onMouseLeave }
						ref={ setRef }
						step={ step }
						value={ usedValue ?? '' }
					/>
					<RangeRail
						aria-hidden={ true }
						disabled={ disabled }
						marks={ marks }
						max={ max }
						min={ min }
						railColor={ railColor }
						step={ step }
						value={ usedValue }
					/>
					<Track
						aria-hidden={ true }
						className="components-range-control__track"
						disabled={ disabled }
						style={ { width: fillPercent } }
						trackColor={ trackColor }
					/>
					<ThumbWrapper style={ offsetStyle } disabled={ disabled }>
						<Thumb
							aria-hidden={ true }
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
				{ withInputField && (
					<InputNumber
						aria-label={ label }
						className="components-range-control__number"
						disabled={ disabled }
						inputMode="decimal"
						isShiftStepEnabled={ isShiftStepEnabled }
						onBlur={ handleOnInputNumberBlur }
						shiftStep={ shiftStep }
						step={ step }
						{ ...someNumberInputProps }
					/>
				) }
				{ allowReset && (
					<ActionRightWrapper>
						<Button
							className="components-range-control__reset"
							disabled={ disabled || value === undefined }
							variant="secondary"
							isSmall
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

const ForwardedComponent = forwardRef( RangeControl );

export default ForwardedComponent;
