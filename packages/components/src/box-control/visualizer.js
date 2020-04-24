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
import { DEFAULT_VALUES } from './utils';

export default function BoxControlVisualizer( {
	children,
	values: valuesProp = DEFAULT_VALUES,
	...props
} ) {
	return (
		<Container { ...props } aria-hidden="true">
			<Sides values={ valuesProp } />
			{ children }
		</Container>
	);
}

function Sides( { values } ) {
	const { top, right, bottom, left } = values;

	return (
		<>
			<Top value={ top } />
			<Right value={ right } />
			<Bottom value={ bottom } />
			<Left value={ left } />
		</>
	);
}

function Top( { value } ) {
	const height = value;
	const animationProps = useSideAnimation( height );

	return <TopView { ...animationProps } style={ { height } } />;
}

function Right( { value } ) {
	const width = value;
	const animationProps = useSideAnimation( width );

	return <RightView { ...animationProps } style={ { width } } />;
}

function Bottom( { value } ) {
	const height = value;
	const animationProps = useSideAnimation( height );

	return <BottomView { ...animationProps } style={ { height } } />;
}

function Left( { value } ) {
	const width = value;
	const animationProps = useSideAnimation( width );

	return <LeftView { ...animationProps } style={ { width } } />;
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
