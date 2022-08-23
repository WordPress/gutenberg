/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	GridView,
	GridLineX,
	GridLineY,
} from './styles/focal-point-picker-style';
import { useUpdateEffect } from '../utils/hooks';

export default function FocalPointPickerGrid( {
	bounds = {},
	value,
	...props
} ) {
	const animationProps = useRevealAnimation( value );
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

	useUpdateEffect( () => {
		setIsActive( true );
		const timeout = window.setTimeout( () => {
			setIsActive( false );
		}, 600 );

		return () => window.clearTimeout( timeout );
	}, [ value ] );

	return {
		isActive,
	};
}
