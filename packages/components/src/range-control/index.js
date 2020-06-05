/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp, isFinite, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useState, forwardRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import Icon from '../icon';
import { color } from '../utils/colors';
import {
	floatClamp,
	useControlledRangeValue,
	useDebouncedHoverInteraction,
} from './utils';
import RangeRail from './rail';
import SimpleTooltip from './tooltip';
import {
	ActionRightWrapper,
	AfterIconWrapper,
	BeforeIconWrapper,
	InputRange,
	Root,
	Track,
	ThumbWrapper,
	Thumb,
	Wrapper,
} from './styles/range-control-styles';
import InputField from './input-field';
import { useRTL } from '../utils/rtl';

function RangeControl(
	{
		afterIcon,
		allowReset = false,
		beforeIcon,
		className,
		currentInput,
		color: colorProp = color( 'ui.brand' ),
		disabled = false,
		help,
		initialPosition,
		isShiftStepEnabled = true,
		label,
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
	const isRTL = useRTL();

	const sliderValue = valueProp !== undefined ? valueProp : initialPosition;

	const [ value, setValue ] = useControlledRangeValue( {
		min,
		max,
		value: sliderValue,
	} );
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
	const currentValue = value !== undefined ? value : currentInput;

	const inputSliderValue = isValueReset ? '' : currentValue;

	const rangeFillValue = isValueReset
		? floatClamp( max / 2, min, max )
		: value;

	const calculatedFillValue = ( ( value - min ) / ( max - min ) ) * 100;
	const fillValue = isValueReset ? 50 : calculatedFillValue;
	const fillValueOffset = `${ clamp( fillValue, 0, 100 ) }%`;

	const classes = classnames( 'components-range-control', className );

	const wrapperClasses = classnames(
		'components-range-control__wrapper',
		!! marks && 'is-marked'
	);

	const id = useInstanceId( RangeControl, 'inspector-range-control' );
	const describedBy = !! help ? `${ id }__help` : undefined;
	const enableTooltip = showTooltipProp !== false && isFinite( value );

	const handleOnChange = ( event ) => {
		const nextValue = parseFloat( event.target.value );

		if ( isNaN( nextValue ) ) {
			handleOnReset();
			return;
		}

		setValue( nextValue );
		onChange( nextValue );
	};

	const handleOnReset = () => {
		let resetValue = parseFloat( resetFallbackValue );
		let onChangeResetValue = resetValue;

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

	const hoverInteractions = useDebouncedHoverInteraction( {
		onShow: handleShowTooltip,
		onHide: handleHideTooltip,
		onMouseMove,
		onMouseLeave,
	} );

	const offsetStyle = {
		[ isRTL ? 'right' : 'left' ]: fillValueOffset,
	};

	return (
		<BaseControl
			className={ classes }
			label={ label }
			id={ id }
			help={ help }
		>
			<Root className="components-range-control__root" isRTL={ isRTL }>
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
						{ ...hoverInteractions }
						aria-describedby={ describedBy }
						aria-label={ label }
						aria-hidden={ false }
						className="components-range-control__slider"
						disabled={ disabled }
						id={ id }
						max={ max }
						min={ min }
						onBlur={ handleOnBlur }
						onChange={ handleOnChange }
						onFocus={ handleOnFocus }
						ref={ setRef }
						step={ step }
						tabIndex={ 0 }
						type="range"
						value={ inputSliderValue }
					/>
					<RangeRail
						aria-hidden={ true }
						disabled={ disabled }
						marks={ marks }
						max={ max }
						min={ min }
						railColor={ railColor }
						step={ step }
						value={ rangeFillValue }
					/>
					<Track
						aria-hidden={ true }
						className="components-range-control__track"
						disabled={ disabled }
						style={ { width: fillValueOffset } }
						trackColor={ trackColor }
					/>
					<ThumbWrapper style={ offsetStyle }>
						<Thumb
							aria-hidden={ true }
							isFocused={ isThumbFocused }
						/>
					</ThumbWrapper>
					{ enableTooltip && (
						<SimpleTooltip
							className="components-range-control__tooltip"
							inputRef={ inputRef }
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
					<InputField
						disabled={ disabled }
						isShiftStepEnabled={ isShiftStepEnabled }
						label={ label }
						max={ max }
						min={ min }
						onChange={ handleOnChange }
						onReset={ handleOnReset }
						shiftStep={ shiftStep }
						step={ step }
						value={ inputSliderValue }
					/>
				) }
				{ allowReset && (
					<ActionRightWrapper>
						<Button
							className="components-range-control__reset"
							disabled={ disabled || value === undefined }
							isSecondary
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
