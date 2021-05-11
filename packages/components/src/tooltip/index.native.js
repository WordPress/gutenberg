/**
 * External dependencies
 */
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	cloneElement,
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { createSlotFill } from '../slot-fill';
import styles from './style.scss';

const RIGHT_ALIGN_ARROW_OFFSET = 16;
const TOOLTIP_VERTICAL_OFFSET = 2;

const TooltipContext = createContext( {
	onHandleScreenTouch: () => {},
} );
const { Fill, Slot } = createSlotFill( 'Tooltip' );

const Tooltip = ( {
	children,
	position = 'top',
	text,
	visible: initialVisible = false,
} ) => {
	const referenceElementRef = useRef( null );
	const animationValue = useRef( new Animated.Value( 0 ) ).current;
	const [ , horizontalPosition = 'center' ] = position.split( ' ' );
	const [ visible, setVisible ] = useState( initialVisible );
	const previousVisible = usePrevious( visible );
	const [ referenceLayout, setReferenceLayout ] = useState( {
		height: 0,
		width: 0,
		x: 0,
		y: 0,
	} );
	const [ tooltipLayout, setTooltipLayout ] = useState( {
		height: 0,
		width: 0,
	} );
	const { onHandleScreenTouch } = useContext( TooltipContext );

	// Register callback to dismiss the tooltip whenever the screen is touched
	useEffect( () => {
		if ( visible ) {
			onHandleScreenTouch( () => setVisible( false ) );
		}
		return () => onHandleScreenTouch( null );
	}, [ visible ] );

	useEffect( () => {
		if (
			// Initial render and visibility enabled, animate show
			( typeof previousVisible === 'undefined' && visible ) ||
			// Previously visible, animate hide
			( previousVisible && previousVisible !== visible )
		) {
			startAnimation();
		}
	}, [ visible ] );

	const startAnimation = () => {
		Animated.timing( animationValue, {
			toValue: visible ? 1 : 0,
			duration: visible ? 300 : 150,
			useNativeDriver: true,
			delay: visible ? 500 : 0,
			easing: Easing.out( Easing.quad ),
		} ).start();
	};

	const positionStyles = {
		left:
			referenceLayout.x +
			Math.floor( referenceLayout.width / 2 ) -
			( horizontalPosition === 'right'
				? RIGHT_ALIGN_ARROW_OFFSET
				: Math.floor( tooltipLayout.width / 2 ) ),
		top: referenceLayout.y - tooltipLayout.height - TOOLTIP_VERTICAL_OFFSET,
		position: 'absolute',
	};
	const tooltipStyles = [
		styles.tooltip,
		horizontalPosition === 'right' && styles[ 'tooltip--rightAlign' ],
		{
			elevation: 2,
			opacity: animationValue,
			shadowColor: styles.tooltip__shadow?.color,
			shadowOffset: { height: 2, width: 0 },
			shadowOpacity: 0.25,
			shadowRadius: 2,
			transform: [
				{
					translateY: animationValue.interpolate( {
						inputRange: [ 0, 1 ],
						outputRange: [ visible ? 4 : -8, -8 ],
					} ),
				},
			],
		},
	];
	const arrowStyles = [
		styles.tooltip__arrow,
		horizontalPosition === 'right' &&
			styles[ 'tooltip__arrow--rightAlign' ],
	];

	let to;
	const getReferenceElementPosition = () => {
		clearTimeout( to );
		// Timeout used allow render to occur before calculating layout
		to = setTimeout( () => {
			referenceElementRef.current.measure(
				( _x, _y, width, height, pageX, pageY ) => {
					setReferenceLayout( {
						height,
						width,
						x: pageX,
						y: pageY,
					} );
				}
			);
		}, 0 );
	};
	const getTooltipLayout = ( { nativeEvent } ) => {
		const { height, width } = nativeEvent.layout;
		setTooltipLayout( { height, width } );
	};

	return (
		<>
			{ cloneElement( children, {
				ref: referenceElementRef,
				onLayout: getReferenceElementPosition,
			} ) }
			{ /* TODO(David): Animation out does not work as this immediately removes the element. */ }
			{ visible && (
				<Fill>
					<View
						onLayout={ getTooltipLayout }
						style={ positionStyles }
					>
						<Animated.View style={ tooltipStyles }>
							<Text style={ styles.tooltip__text }>{ text }</Text>
							<View style={ arrowStyles } />
						</Animated.View>
					</View>
				</Fill>
			) }
		</>
	);
};

const TooltipSlot = ( { children, ...rest } ) => {
	const [ handleScreenTouch, setHandleScreenTouch ] = useState( null );
	const onHandleScreenTouch = ( callback ) => {
		// Must use function to set state below as `callback` is a function itself
		setHandleScreenTouch( () => callback );
	};
	const handleTouchStart = () => {
		if ( handleScreenTouch ) {
			handleScreenTouch();
			setHandleScreenTouch( null );
		}
	};

	return (
		// TODO(David): We may should avoid new object generation for value in the
		// render. https://reactjs.org/docs/context.html#caveats
		<TooltipContext.Provider value={ { onHandleScreenTouch } }>
			<View
				onTouchStart={ handleTouchStart }
				pointerEvents="box-none"
				style={ StyleSheet.absoluteFill }
			>
				{ children }
				<Slot { ...rest } />
			</View>
		</TooltipContext.Provider>
	);
};

Tooltip.Slot = TooltipSlot;

export default Tooltip;
