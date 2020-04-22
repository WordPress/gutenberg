/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { color, rtl } from '../utils/style-mixins';
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

const Container = styled.div`
	box-sizing: border-box;
	position: relative;
`;

const Side = styled.div`
	box-sizing: border-box;
	background: ${color( 'ui.brand' )};
	filter: brightness( 1 );
	opacity: 0;
	position: absolute;
	pointer-events: none;
	transition: opacity 120ms linear;
	z-index: 1;

	${( { isActive } ) =>
		isActive &&
		`
		opacity: 0.3;
	`}
`;

const TopView = styled( Side )`
	top: 0;
	left: 0;
	right: 0;
`;

const RightView = styled( Side )`
	top: 0;
	bottom: 0;
	${rtl( { right: 0 } )};
`;

const BottomView = styled( Side )`
	bottom: 0;
	left: 0;
	right: 0;
`;

const LeftView = styled( Side )`
	top: 0;
	bottom: 0;
	${rtl( { left: 0 } )};
`;
