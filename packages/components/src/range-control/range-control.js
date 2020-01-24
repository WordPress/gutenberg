/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
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
import Dashicon from '../dashicon';

import { color } from '../utils/colors';
import RangeRail from './rail';
import SimpleTooltip from './tooltip';
import {
	Root,
	Track,
	ThumbWrapper,
	Thumb,
	InputRange,
	Wrapper,
} from './styles/range-control-styles';

export const RangeControlNext = forwardRef(
	(
		{
			afterIcon,
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
			onChange = noop,
			renderTooltipContent = ( v ) => v,
			step = 1,
			tooltipPosition = 'auto',
			tooltipTimeout = 250,
			tooltipZIndex = 100,
			value: valueProp = 0,
			...props
		},
		ref
	) => {
		const [ value, setValue ] = useControlledRangeValue( valueProp );
		const [ showTooltip, setShowTooltip ] = useState( false );

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

		const handleShowTooltip = () => setShowTooltip( true );
		const handleHideTooltip = () => setShowTooltip( false );

		const hoverInteractions = useDebouncedHoverInteraction( {
			onShow: handleShowTooltip,
			onHide: handleHideTooltip,
			timeout: tooltipTimeout,
		} );

		return (
			<BaseControl className={ classes } label={ label } id={ id } help={ help }>
				<Root className="components-range-control__root">
					{ beforeIcon && <Dashicon icon={ beforeIcon } /> }
					<Wrapper color={ colorProp }>
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
							onBlur={ handleHideTooltip }
							onChange={ handleOnChange }
							onFocus={ handleShowTooltip }
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
							{ enableTooltip && (
								<SimpleTooltip
									className="components-range-control__tooltip"
									inputRef={ inputRef }
									renderTooltipContent={ renderTooltipContent }
									position={ tooltipPosition }
									show={ alwaysShowTooltip || showTooltip }
									value={ value }
									zIndex={ tooltipZIndex }
								/>
							) }
						</ThumbWrapper>
					</Wrapper>
					{ afterIcon && <Dashicon icon={ afterIcon } /> }
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
