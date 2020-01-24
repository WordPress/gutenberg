/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

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

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import Dashicon from '../dashicon';

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

export const RangeControlNext = forwardRef(
	(
		{
			afterIcon,
			allowReset = false,
			alwaysShowTooltip = false,
			beforeIcon,
			className,
			color: colorProp = color( 'blue.wordpress.700' ),
			disabled = false,
			disableToolTip = false,
			help,
			id,
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
			step = 1,
			width = '100%',
			tooltipPosition = 'auto',
			tooltipTimeout = 250,
			tooltipZIndex = 100,
			value: valueProp = 0,
			withInputField = true,
			...props
		},
		ref
	) => {
		const [ value, setValue ] = useControlledRangeValue( valueProp );
		const [ showTooltip, setShowTooltip ] = useState( false );
		const originalValueRef = useRef( value );

		const inputRef = useRef();

		const setRef = ( nodeRef ) => {
			inputRef.current = nodeRef;

			if ( ref ) {
				ref( nodeRef );
			}
		};

		const isFocused = ! disabled && showTooltip;
		const fillValue = `${ ( value / max ) * 100 }%`;

		const classes = classnames( 'components-range-control', className );
		const wrapperClasses = classnames(
			'components-range-control__wrapper',
			!! marks && 'is-marked'
		);

		const describedBy = !! help ? `${ id }__help` : undefined;
		const enableTooltip = ! disableToolTip;

		const handleOnChange = ( event ) => {
			const nextValue = event.target.value;

			if ( ! event.target.checkValidity() ) {
				return;
			}

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
			handleHideTooltip();
		};

		const handleOnFocus = ( event ) => {
			onFocus( event );
			handleShowTooltip();
		};

		const hoverInteractions = useDebouncedHoverInteraction( {
			onShow: handleShowTooltip,
			onHide: handleHideTooltip,
			onMouseEnter,
			onMouseLeave,
			timeout: tooltipTimeout,
		} );

		return (
			<BaseControl className={ classes } label={ label } id={ id } help={ help }>
				<Root className="components-range-control__root" width={ width }>
					{ beforeIcon && (
						<BeforeIconWrapper>
							<Dashicon icon={ beforeIcon } />
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
							className="components-range-control__input"
							disabled={ disabled }
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
							style={ { width: fillValue } }
						/>
						<ThumbWrapper style={ { left: fillValue } }>
							<Thumb aria-hidden={ true } isFocused={ isFocused } />
						</ThumbWrapper>
						{ enableTooltip && (
							<SimpleTooltip
								{ ...hoverInteractions }
								className="components-range-control__tooltip"
								inputRef={ inputRef }
								renderTooltipContent={ renderTooltipContent }
								position={ tooltipPosition }
								show={ alwaysShowTooltip || showTooltip }
								style={ { left: fillValue } }
								value={ value }
								zIndex={ tooltipZIndex }
							/>
						) }
					</Wrapper>
					{ afterIcon && (
						<AfterIconWrapper>
							<Dashicon icon={ afterIcon } />
						</AfterIconWrapper>
					) }
					{ withInputField && (
						<InputNumber
							aria-label={ label }
							className="components-range-control__number"
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

function useControlledRangeValue( { value: valueProp = 0 } ) {
	const [ value, _setValue ] = useState( parseFloat( valueProp ) );
	const valueRef = useRef( valueProp );

	useEffect( () => {
		if ( valueRef.current !== valueProp ) {
			setValue( valueProp );
			valueRef.current = valueProp;
		}
	}, [ valueRef, valueProp, setValue ] );

	const setValue = useCallback(
		( nextValue ) => {
			_setValue( parseFloat( nextValue ) );
		},
		[ _setValue ]
	);

	return [ value, setValue ];
}

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
