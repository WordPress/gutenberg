/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Container,
	TopView,
	RightView,
	BottomView,
	LeftView,
} from './styles/box-control-visualizer-styles';
import {
	DEFAULT_VISUALIZER_VALUES,
	DEFAULT_VISUALIZER_SPACING_VALUES,
	DEFAULT_SPACING_VALUES,
} from './utils';

export default function BoxControlVisualizer( {
	children,
	showValues = DEFAULT_VISUALIZER_SPACING_VALUES,
	values,
	...props
} ) {
	const isPositionAbsolute = ! children;
	const valuesProp = { ...DEFAULT_SPACING_VALUES, ...values };
	const marginProps = showValues && showValues.margin;
	const isMarginVisualizer =
		marginProps && Object.values( marginProps ).filter( Boolean ).length;

	return (
		<Container
			{ ...props }
			isPositionAbsolute={ isPositionAbsolute }
			aria-hidden="true"
		>
			<Sides
				showValues={
					isMarginVisualizer ? showValues.margin : showValues.padding
				}
				values={
					isMarginVisualizer ? valuesProp.margin : valuesProp.padding
				}
				setTransformStyle={ isMarginVisualizer }
			/>
			{ children }
		</Container>
	);
}

function Sides( {
	showValues = DEFAULT_VISUALIZER_VALUES,
	values,
	setTransformStyle,
} ) {
	const { top, right, bottom, left } = values;

	return (
		<>
			<Top
				isVisible={ showValues.top }
				value={ top }
				setTransformStyle={ setTransformStyle }
			/>
			<Right
				isVisible={ showValues.right }
				value={ right }
				setTransformStyle={ setTransformStyle }
			/>
			<Bottom
				isVisible={ showValues.bottom }
				value={ bottom }
				setTransformStyle={ setTransformStyle }
			/>
			<Left
				isVisible={ showValues.left }
				value={ left }
				setTransformStyle={ setTransformStyle }
			/>
		</>
	);
}

function Top( { isVisible = false, value, setTransformStyle } ) {
	const height = value;
	const animationProps = useSideAnimation( height );
	const isActive = animationProps.isActive || isVisible;
	return (
		<TopView
			isActive={ isActive }
			style={ { height } }
			transform={ setTransformStyle ? 'translateY(-100%)' : null }
		/>
	);
}

function Right( { isVisible = false, value, setTransformStyle } ) {
	const width = value;
	const animationProps = useSideAnimation( width );
	const isActive = animationProps.isActive || isVisible;

	return (
		<RightView
			isActive={ isActive }
			style={ { width } }
			transform={ setTransformStyle ? 'translateX(100%)' : null }
		/>
	);
}

function Bottom( { isVisible = false, value, setTransformStyle } ) {
	const height = value;
	const animationProps = useSideAnimation( height );
	const isActive = animationProps.isActive || isVisible;
	return (
		<BottomView
			isActive={ isActive }
			style={ { height } }
			transform={ setTransformStyle ? 'translateY(100%)' : null }
		/>
	);
}

function Left( { isVisible = false, value, setTransformStyle } ) {
	const width = value;
	const animationProps = useSideAnimation( width );
	const isActive = animationProps.isActive || isVisible;

	return (
		<LeftView
			isActive={ isActive }
			style={ { width } }
			transform={ setTransformStyle ? 'translateX(-100%)' : null }
		/>
	);
}

/**
 * Custom hook that renders the "flash" animation whenever the value changes.
 *
 * @param {string} value Value of (box) side.
 */
function useSideAnimation( value ) {
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
			}, 400 );
		}

		return () => clearTimer();
	}, [ value ] );

	return {
		isActive,
	};
}
