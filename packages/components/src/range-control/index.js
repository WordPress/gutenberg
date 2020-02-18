/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useCallback,
	useRef,
	useEffect,
	useState,
	forwardRef,
} from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import Icon from '../icon';

import { color } from '../utils/colors';
import RangeRail from './rail';
import SimpleTooltip from './tooltip';
import {
	ActionRightWrapper,
	AfterIconWrapper,
	BeforeIconWrapper,
	InputRange,
	InputNumber,
	Root,
	Track,
	ThumbWrapper,
	Thumb,
	Wrapper,
} from './styles/range-control-styles';
import { useRtl } from '../utils/rtl';

const BaseRangeControl = forwardRef(
	(
		{
			afterIcon,
			allowReset = false,
			beforeIcon,
			className,
			color: colorProp = color( 'blue.wordpress.700' ),
			disabled = false,
			help,
			instanceId,
			initialPosition,
			label,
			marks = false,
			max = 100,
			min = 0,
			onBlur = noop,
			onChange = noop,
			onFocus = noop,
			onMouseEnter = noop,
			onMouseLeave = noop,
			renderTooltipContent = ( v ) => v,
			showTooltip: showTooltipProp,
			step = 1,
			value: valueProp = 0,
			withInputField = true,
			...props
		},
		ref
	) => {
		const isRTL = useRtl();

		const sliderValue = initialPosition || valueProp;
		const [ value, setValue ] = useControlledRangeValue( {
			min,
			max,
			value: sliderValue,
		} );
		const [ showTooltip, setShowTooltip ] = useState( showTooltipProp );
		const [ isFocused, setIsFocused ] = useState( false );
		const originalValueRef = useRef( value );

		const inputRef = useRef();

		const setRef = ( nodeRef ) => {
			inputRef.current = nodeRef;

			if ( ref ) {
				ref( nodeRef );
			}
		};

		const isThumbFocused = ! disabled && isFocused;
		const fillValue = ( ( value - min ) / ( max - min ) ) * 100;
		const fillValueOffset = `${ clamp( fillValue, 0, 100 ) }%`;

		const classes = classnames( 'components-range-control', className );

		const wrapperClasses = classnames(
			'components-range-control__wrapper',
			!! marks && 'is-marked'
		);

		const id = `inspector-range-control-${ instanceId }`;

		const describedBy = !! help ? `${ id }__help` : undefined;
		const enableTooltip = showTooltipProp !== false;

		const handleOnChange = ( event ) => {
			if ( ! event.target.checkValidity() ) {
				return;
			}

			const nextValue = parseFloat( event.target.value );

			setValue( nextValue );
			onChange( nextValue );
		};

		const handleOnReset = () => {
			const nextValue = originalValueRef.current;

			setValue( nextValue );
			onChange( nextValue );
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
			onMouseEnter,
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
				<Root
					className="components-range-control__root"
					isRTL={ isRTL }
				>
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
							value={ value }
						/>
						<RangeRail
							aria-hidden={ true }
							marks={ marks }
							max={ max }
							min={ min }
							step={ step }
							value={ value }
						/>
						<Track
							aria-hidden={ true }
							className="components-range-control__track"
							style={ { width: fillValueOffset } }
						/>
						<ThumbWrapper style={ offsetStyle }>
							<Thumb
								aria-hidden={ true }
								isFocused={ isThumbFocused }
							/>
						</ThumbWrapper>
						{ enableTooltip && (
							<SimpleTooltip
								{ ...hoverInteractions }
								className="components-range-control__tooltip"
								inputRef={ inputRef }
								renderTooltipContent={ renderTooltipContent }
								show={ showTooltip || showTooltip }
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
							inputMode="decimal"
							max={ max }
							min={ min }
							onChange={ handleOnChange }
							step={ step }
							type="number"
							value={ value }
						/>
					) }
					{ allowReset && (
						<ActionRightWrapper>
							<Button
								className="components-range-control__reset"
								disabled={ value === undefined }
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
);

/**
 * A float supported clamp function for a specific value.
 *
 * @param {number} value The value to clamp
 * @param {number} min The minimum value
 * @param {number} max The maxinum value
 * @return {number} A (float) number
 */
function floatClamp( value, min, max ) {
	return parseFloat( clamp( value, min, max ) );
}

/**
 * Hook to store a clamped value, derived from props.
 */
function useControlledRangeValue( { min, max, value: valueProp = 0 } ) {
	const [ value, _setValue ] = useState( floatClamp( valueProp, min, max ) );
	const valueRef = useRef( value );

	const setValue = useCallback(
		( nextValue ) => {
			_setValue( floatClamp( nextValue, min, max ) );
		},
		[ _setValue, min, max ]
	);

	useEffect( () => {
		if ( valueRef.current !== valueProp ) {
			setValue( valueProp );
			valueRef.current = valueProp;
		}
	}, [ valueRef, valueProp, setValue ] );

	return [ value, setValue ];
}

/**
 * Hook to encapsulate the debouncing "hover" to better handle the showing
 * and hiding of the Tooltip.
 */
function useDebouncedHoverInteraction( {
	onShow = noop,
	onHide = noop,
	onMouseEnter = noop,
	onMouseLeave = noop,
	timeout = 250,
} ) {
	const [ show, setShow ] = useState( false );
	const timeoutRef = useRef();

	const handleOnMouseEnter = useCallback( ( event ) => {
		onMouseEnter( event );

		if ( timeoutRef.current ) {
			window.clearTimeout( timeoutRef.current );
		}

		if ( ! show ) {
			setShow( true );
			onShow();
		}
	}, [] );

	const handleOnMouseLeave = useCallback( ( event ) => {
		onMouseLeave( event );

		timeoutRef.current = setTimeout( () => {
			setShow( false );
			onHide();
		}, timeout );
	}, [] );

	return {
		onMouseEnter: handleOnMouseEnter,
		onMouseLeave: handleOnMouseLeave,
	};
}

export const RangeControlNext = compose( withInstanceId )( BaseRangeControl );

export default RangeControlNext;
