/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { color } from '../utils/colors';
import RangeRail from './rail';
import RangeTooltip from './tooltip';
import { Root, Track, ThumbWrapper, Thumb, InputRange } from './styles/range-control-styles';

export const RangeControlNext = forwardRef( ( {
	alwaysShowTooltip = false,
	className,
	color: colorProp = color( 'blue.wordpress.700' ),
	disabled,
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
	tooltipPosition,
	tooltipZIndex = 100,
	value: valueProp = 0,
}, ref ) => {
	const [ value, setValue ] = useControlledRangeValue( valueProp );
	const [ showTooltip, setShowTooltip ] = useState( false );

	const inputRef = useRef();

	const handleOnChange = ( event ) => {
		const newValue = event.target.value;
		// If the input value is invalid temporarily save it to the state,
		// without calling on change.
		if ( ! event.target.checkValidity() ) {
			return;
		}

		setValue( newValue );

		onChange( ( newValue === '' ) ?
			undefined :
			parseFloat( newValue )
		);
	};

	const isFocused = showTooltip;
	const fillValue = `${ parseFloat( value ) / max * 100 }%`;

	const handleShowTooltip = () => {
		setShowTooltip( true );
	};

	const handleHideTooltip = () => {
		setShowTooltip( false );
	};

	const setRef = ( nodeRef ) => {
		inputRef.current = nodeRef;
		if ( ref ) {
			ref( nodeRef );
		}
	};

	const classes = classnames( 'components-range-control', className );
	const describedBy = !! help ? `${ id }__help` : undefined;
	const enableTooltip = ! disableToolTip;

	return (
		<BaseControl
			label={ label }
			id={ id }
			help={ help }
			className={ classes }
		>
			<Root color={ colorProp }>
				<RangeRail
					marks={ marks }
					max={ max }
					min={ min }
					step={ step }
					value={ value }
				/>
				<Track style={ { width: fillValue } } />
				<ThumbWrapper style={ { left: fillValue } }>
					<Thumb isFocused={ isFocused } />
					{ enableTooltip && (
						<RangeTooltip
							inputRef={ inputRef }
							renderTooltipContent={ renderTooltipContent }
							position={ tooltipPosition }
							show={ alwaysShowTooltip || showTooltip }
							value={ value }
							zIndex={ tooltipZIndex }
						/>
					) }
				</ThumbWrapper>
				<InputRange
					aria-describedby={ describedBy }
					aria-label={ label }
					disabled={ disabled }
					max={ max }
					min={ min }
					onBlur={ handleHideTooltip }
					onChange={ handleOnChange }
					onFocus={ handleShowTooltip }
					onMouseEnter={ handleShowTooltip }
					onMouseLeave={ handleHideTooltip }
					ref={ setRef }
					step={ step }
					tabIndex={ 0 }
					type="range"
					value={ value }
				/>
			</Root>
		</BaseControl>
	);
} );

function useControlledRangeValue( { value: valueProp = 0 } ) {
	const [ value, setValue ] = useState( valueProp );
	const valueRef = useRef( valueProp );

	useEffect( () => {
		if ( valueRef.current !== valueProp ) {
			setValue( valueProp );
			valueRef.current = valueProp;
		}
	}, [ valueRef, valueProp, setValue ] );

	return [ value, setValue ];
}
