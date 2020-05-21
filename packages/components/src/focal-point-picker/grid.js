/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	GridView,
	GridLineX,
	GridLineY,
} from './styles/focal-point-picker-style';

export default function FocalPointPickerGrid( {
	bounds = {},
	percentages = {
		x: 0.5,
		y: 0.5,
	},
	...props
} ) {
	const percentageValue = percentages.x + percentages.y;
	const animationProps = useRevealAnimation( percentageValue );
	const style = {
		width: bounds.width,
		height: bounds.height,
	};

	return (
		<GridView
			{ ...props }
			{ ...animationProps }
			className="components-focal-point-picker__grid"
			style={ style }
		>
			<GridLineX style={ { top: '33%' } } />
			<GridLineX style={ { top: '66%' } } />
			<GridLineY style={ { left: '33%' } } />
			<GridLineY style={ { left: '66%' } } />
		</GridView>
	);
}

/**
 * Custom hook that renders the "flash" animation whenever the value changes.
 *
 * @param {string} value Value of (box) side.
 */
function useRevealAnimation( value ) {
	const [ isActive, setIsActive ] = useState( false );
	const valueRef = useRef( value );
	const timeoutRef = useRef();

	const clearTimer = () => {
		if ( timeoutRef.current ) {
			window.clearTimeout( timeoutRef.current );
		}
	};

	useEffect( () => {
		if ( value !== valueRef.current ) {
			setIsActive( true );
			valueRef.current = value;

			clearTimer();

			timeoutRef.current = setTimeout( () => {
				setIsActive( false );
			}, 600 );
		}

		return () => clearTimer();
	}, [ value ] );

	return {
		isActive,
	};
}
