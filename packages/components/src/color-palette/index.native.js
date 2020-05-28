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
import { map, uniq } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState, useEffect, createRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';
import ColorIndicator from '../color-indicator';
import { colorsUtils } from '../mobile/color-settings/utils';

const ANIMATION_DURATION = 200;

function ColorPalette( {
	setColor,
	activeColor,
	isGradientColor,
	defaultSettings,
	currentSegment,
	onCustomPress,
	shouldEnableBottomSheetScroll,
} ) {
	const customSwatchGradients = [
		'linear-gradient(120deg, rgba(255,0,0,.8), 0%, rgba(255,255,255,1) 70.71%)',
		'linear-gradient(240deg, rgba(0,255,0,.8), 0%, rgba(0,255,0,0) 70.71%)',
		'linear-gradient(360deg, rgba(0,0,255,.8), 0%, rgba(0,0,255,0) 70.71%)',
	];

	const scrollViewRef = createRef();

	const isGradientSegment = currentSegment === colorsUtils.segments[ 1 ];

	const [ scale ] = useState( new Animated.Value( 1 ) );
	const [ opacity ] = useState( new Animated.Value( 1 ) );

	const defaultColors = uniq( map( defaultSettings.colors, 'color' ) );
	const defaultGradientColors = uniq(
		map( defaultSettings.gradients, 'gradient' )
	);
	const colors = isGradientSegment ? defaultGradientColors : defaultColors;

	useEffect( () => {
		scrollViewRef.current.scrollTo( { x: 0, y: 0 } );
	}, [ currentSegment ] );

	function isSelectedCustom() {
		return (
			! isGradientColor && activeColor && ! colors.includes( activeColor )
		);
	}

	function isSelected( color ) {
		return ! isSelectedCustom() && activeColor === color;
	}

	function timingAnimation( property, toValue ) {
		return Animated.timing( property, {
			toValue,
			duration: ANIMATION_DURATION,
			easing: Easing.ease,
			useNativeDriver: true,
		} );
	}

	function performAnimation( color ) {
		opacity.setValue( isSelected( color ) ? 1 : 0 );
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

	function onColorPress( color ) {
		performAnimation( color );
		setColor( color );
	}

	const verticalSeparatorStyle = usePreferredColorSchemeStyle(
		styles.verticalSeparator,
		styles.verticalSeparatorDark
	);

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
			{ colors.map( ( color ) => {
				const scaleValue = isSelected( color ) ? scaleInterpolation : 1;
				return (
					<TouchableWithoutFeedback
						onPress={ () => onColorPress( color ) }
						key={ `${ color }-${ isSelected( color ) }` }
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
								isSelected={ isSelected( color ) }
								opacity={ opacity }
								style={ styles.colorIndicator }
							/>
						</Animated.View>
					</TouchableWithoutFeedback>
				);
			} ) }
			{ ! isGradientSegment && (
				<>
					<View style={ verticalSeparatorStyle } />
					<TouchableWithoutFeedback onPress={ onCustomPress }>
						<View>
							<ColorIndicator
								withCustomPicker={ ! isGradientSegment }
								color={ customSwatchGradients }
								isSelected={ isSelectedCustom() }
								style={ styles.colorIndicator }
							/>
						</View>
					</TouchableWithoutFeedback>
				</>
			) }
		</ScrollView>
	);
}

export default ColorPalette;
