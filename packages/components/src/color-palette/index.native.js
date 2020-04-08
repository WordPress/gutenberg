/**
 * External dependencies
 */
import {
	ScrollView,
	TouchableWithoutFeedback,
	View,
	Animated,
	Easing,
} from 'react-native';
import { map } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState, useEffect, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';
import ColorIndicator from '../color-indicator';

const ANIMATION_DURATION = 200;

function ColorPalette( {
	setBackgroundColor,
	setTextColor,
	setGradient,
	backgroundColor,
	textColor,
	defaultSettings,
	currentSegment,
	currentScreen,
	onCustomPress,
	getStylesFromColorScheme,
	shouldEnableBottomSheetScroll,
} ) {
	const customSwatchGradients = [
		'linear-gradient(120deg, rgba(255,0,0,.8), 0%, rgba(255,255,255,1) 70.71%)',
		'linear-gradient(240deg, rgba(0,255,0,.8), 0%, rgba(0,255,0,0) 70.71%)',
		'linear-gradient(360deg, rgba(0,0,255,.8), 0%, rgba(0,0,255,0) 70.71%)',
	];

	const extendedDefaultColors = [
		{
			name: __( 'White' ),
			slug: 'white',
			color: '#ffffff',
		},
		{
			name: __( 'Black' ),
			slug: 'black',
			color: '#000000',
		},
		...defaultSettings.colors,
	];

	const scrollViewRef = createRef();

	const isGradientSegment = currentSegment === 'Gradient';
	const isTextScreen = currentScreen === 'Text';

	const [ activeBgColor, setActiveBgColor ] = useState( backgroundColor );
	const [ activeTextColor, setActiveTextColor ] = useState( textColor );
	const [ scale ] = useState( new Animated.Value( 1 ) );
	const [ opacity ] = useState( new Animated.Value( 1 ) );

	const defaultColors = map( extendedDefaultColors, 'color' );
	const defaultGradientColors = map( defaultSettings.gradients, 'gradient' );

	useEffect( () => {
		scrollViewRef.current.scrollTo( { x: 0, y: 0 } );
	}, [ currentSegment ] );

	function isSelected( color ) {
		const isSelectedBgColor = color === activeBgColor;
		const isSelectedTextColor = color === activeTextColor;
		return isTextScreen ? isSelectedTextColor : isSelectedBgColor;
	}

	function isSelectedCustom() {
		const isSelectedCustomBgColor =
			! defaultColors.includes( activeBgColor ) &&
			! defaultGradientColors.includes( activeBgColor );
		const isSelectedCustomTextColor = ! defaultColors.includes(
			activeTextColor
		);

		return isTextScreen
			? isSelectedCustomTextColor
			: isSelectedCustomBgColor;
	}

	function timingAnimation( property, toValue ) {
		return Animated.timing( property, {
			toValue,
			duration: ANIMATION_DURATION,
			easing: Easing.ease,
		} );
	}

	function performAnimation( value ) {
		opacity.setValue( isSelected( value ) ? 1 : 0 );
		scale.setValue( 1 );

		Animated.parallel( [
			timingAnimation( scale, 2 ),
			timingAnimation( opacity, 1 ),
		] ).start();
	}

	const scaleInterpolation = scale.interpolate( {
		inputRange: [ 1, 1.5, 2 ],
		outputRange: [ 1, 0.7, 1 ],
	} );

	function onColorPress( value ) {
		performAnimation( value );

		setActiveBgColor( value );
		setActiveTextColor( value );

		if ( isTextScreen ) {
			setTextColor( value );
		} else if ( ! isTextScreen && isGradientSegment ) {
			setGradient( value );
			setBackgroundColor();
		} else {
			setBackgroundColor( value );
			setGradient();
		}
	}

	function Palette( { gradient, custom } ) {
		const palette = gradient ? defaultGradientColors : defaultColors;
		const verticalSeparatorStyle = getStylesFromColorScheme(
			styles.verticalSeparator,
			styles.verticalSeparatorDark
		);

		return (
			<>
				{ palette.map( ( color ) => {
					const scaleValue = isSelected( color )
						? scaleInterpolation
						: 1;
					return (
						<TouchableWithoutFeedback
							onPress={ () => onColorPress( color ) }
							key={ color }
						>
							<Animated.View
								style={ {
									transform: [
										{
											scale: scaleValue,
										},
									],
								} }
							>
								<ColorIndicator
									color={ color }
									gradient
									isSelected={ isSelected( color ) }
									opacity={ opacity }
									style={ styles.colorIndicator }
								/>
							</Animated.View>
						</TouchableWithoutFeedback>
					);
				} ) }
				{ custom && (
					<>
						<View style={ verticalSeparatorStyle } />
						<TouchableWithoutFeedback onPress={ onCustomPress }>
							<View>
								<ColorIndicator
									custom
									color={ customSwatchGradients }
									isSelected={ isSelectedCustom() }
									style={ styles.colorIndicator }
								/>
							</View>
						</TouchableWithoutFeedback>
					</>
				) }
			</>
		);
	}

	return (
		<ScrollView
			contentContainerStyle={ styles.contentContainer }
			style={ styles.container }
			horizontal
			showsHorizontalScrollIndicator={ false }
			keyboardShouldPersistTaps="always"
			disableScrollViewPanResponder
			onScrollBeginDrag={ () => shouldEnableBottomSheetScroll( false ) }
			onScrollEndDrag={ () => shouldEnableBottomSheetScroll( true ) }
			ref={ scrollViewRef }
		>
			<TouchableWithoutFeedback>
				{ ! isTextScreen && isGradientSegment ? (
					<Palette gradient />
				) : (
					<Palette custom onCustomPress={ onCustomPress } />
				) }
			</TouchableWithoutFeedback>
		</ScrollView>
	);
}

export default withPreferredColorScheme( ColorPalette );
