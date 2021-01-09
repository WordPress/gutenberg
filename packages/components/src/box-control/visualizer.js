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
	DEFAULT_VALUES,
	extendStyles,
} from './utils';

export default function BoxControlVisualizer( {
	children,
	showValues = DEFAULT_VISUALIZER_SPACING_VALUES,
	values,
	...props
} ) {
	const isPositionAbsolute = ! children;
	const valuesProp = {
		margin: { ...DEFAULT_VALUES, ...values?.margin },
		padding: { ...DEFAULT_VALUES, ...values?.padding },
	};

	return Object.entries( showValues ).map( ( [ key, value ] ) => {
		return (
			<Container
				{ ...props }
				key={ key }
				isPositionAbsolute={ isPositionAbsolute }
				aria-hidden="true"
			>
				<Sides
					showValues={ value }
					type={ key }
					values={ valuesProp[ key ] }
				/>
				{ children }
			</Container>
		);
	} );
}

function Sides( { showValues = DEFAULT_VISUALIZER_VALUES, ...props } ) {
	const { top, right, bottom, left } = Object.entries( props.values ).reduce(
		extendStyles( props.type ),
		{}
	);

	return (
		<>
			<Top isVisible={ showValues.top } value={ top?.style } />
			<Right isVisible={ showValues.right } value={ right?.style } />
			<Bottom isVisible={ showValues.bottom } value={ bottom?.style } />
			<Left isVisible={ showValues.left } value={ left?.style } />
		</>
	);
}

function Top( { isVisible = false, value } ) {
	const { top: height, ...styles } = value;
	const animationProps = useSideAnimation( height );
	const isActive = animationProps.isActive || isVisible;
	return <TopView isActive={ isActive } style={ { height, ...styles } } />;
}

function Right( { isVisible = false, value } ) {
	const { right: width, ...styles } = value;
	const animationProps = useSideAnimation( width );
	const isActive = animationProps.isActive || isVisible;

	return <RightView isActive={ isActive } style={ { width, ...styles } } />;
}

function Bottom( { isVisible = false, value } ) {
	const { bottom: height, ...styles } = value;
	const animationProps = useSideAnimation( height );
	const isActive = animationProps.isActive || isVisible;
	return <BottomView isActive={ isActive } style={ { height, ...styles } } />;
}

function Left( { isVisible = false, value } ) {
	const { left: width, ...styles } = value;
	const animationProps = useSideAnimation( width );
	const isActive = animationProps.isActive || isVisible;

	return <LeftView isActive={ isActive } style={ { width, ...styles } } />;
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
