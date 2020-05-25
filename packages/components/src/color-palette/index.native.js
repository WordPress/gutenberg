/**
 * External dependencies
 */
import {
	TouchableWithoutFeedback,
	View,
	Animated,
	Easing,
	FlatList,
	Dimensions,
	Platform,
} from 'react-native';
import { map, uniq } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, createRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';
import ColorIndicator from '../color-indicator';
import { colorsUtils } from '../mobile/color-settings/utils';
import { performLayoutAnimation } from '../mobile/utils';

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

	const flatListRef = createRef();

	const isGradientSegment = currentSegment === colorsUtils.segments[ 1 ];

	const [ scale ] = useState( new Animated.Value( 1 ) );
	const [ opacity ] = useState( new Animated.Value( 1 ) );

	const defaultColors = uniq( map( defaultSettings.colors, 'color' ) );
	const defaultGradientColors = uniq(
		map( defaultSettings.gradients, 'gradient' )
	);
	const colors = isGradientSegment ? defaultGradientColors : defaultColors;

	const customIndicatorColor = isGradientSegment
		? activeColor
		: customSwatchGradients;
	const shouldShowCustomIndicator =
		! isGradientSegment || ( isGradientColor && isSelectedCustom() );
	const accessibilityHint = isGradientSegment
		? __( 'Navigates to customize gradient' )
		: __( 'Navigates to custom color picker' );

	useEffect( () => {
		if ( flatListRef?.current ) {
			flatListRef.current.scrollToOffset( { x: 0, y: 0 } );
		}
	}, [ currentSegment ] );

	function isSelectedCustom() {
		const isWithinColors = activeColor && colors.includes( activeColor );
		if ( activeColor ) {
			if ( isGradientSegment ) {
				return isGradientColor && ! isWithinColors;
			}
			return ! isGradientColor && ! isWithinColors;
		}
		return false;
	}

	function isSelected( color ) {
		return ! isSelectedCustom() && activeColor === color;
	}

	function timingAnimation( property, toValue ) {
		return Animated.timing( property, {
			toValue,
			duration: ANIMATION_DURATION,
			easing: Easing.ease,
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

	function deselectCustomGradient( index ) {
		const SWATCH_SIZE = styles.colorSwatch.width;
		const SWATCH_NUM_ON_LAYOUT = Math.ceil(
			Dimensions.get( 'window' ).width / SWATCH_SIZE
		);

		if ( isGradientColor && isSelectedCustom() ) {
			if ( Platform.OS === 'android' ) {
				// Scroll position on Android doesn't adjust automatically when removing the last item from the horizontal list.
				// https://github.com/facebook/react-native/issues/27504
				// Workaround: Force the scroll on the last several list items visible on the layout.
				if (
					index > colors.length - SWATCH_NUM_ON_LAYOUT &&
					flatListRef?.current
				) {
					flatListRef.current.scrollToIndex( { index } );
				}
			} else performLayoutAnimation();
		}
	}

	function onContentSizeChange() {
		if ( isSelectedCustom() && flatListRef?.current ) {
			flatListRef.current.scrollToEnd();
		}
	}

	function onColorPress( color, index ) {
		deselectCustomGradient( index );
		performAnimation( color );
		setColor( color );
	}

	const verticalSeparatorStyle = usePreferredColorSchemeStyle(
		styles.verticalSeparator,
		styles.verticalSeparatorDark
	);

	return (
		<FlatList
			data={ colors }
			contentContainerStyle={ styles.contentContainer }
			style={ styles.container }
			horizontal
			showsHorizontalScrollIndicator={ false }
			keyboardShouldPersistTaps="always"
			disableScrollViewPanResponder
			onScrollBeginDrag={ () => shouldEnableBottomSheetScroll( false ) }
			onScrollEndDrag={ () => shouldEnableBottomSheetScroll( true ) }
			onContentSizeChange={ onContentSizeChange }
			ref={ flatListRef }
			keyExtractor={ ( item ) => `${ item }-${ isSelected( item ) }` }
			renderItem={ ( { item, index } ) => {
				const scaleValue = isSelected( item ) ? scaleInterpolation : 1;
				return (
					<TouchableWithoutFeedback
						onPress={ () => onColorPress( item, index ) }
						key={ `${ item }-${ isSelected( item ) }` }
						accessibilityRole={ 'button' }
						accessibilityState={ { selected: isSelected( item ) } }
						accessibilityHint={ item }
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
								color={ item }
								isSelected={ isSelected( item ) }
								opacity={ opacity }
								style={ styles.colorIndicator }
							/>
						</Animated.View>
					</TouchableWithoutFeedback>
				);
			} }
			ListFooterComponent={ () => {
				if ( shouldShowCustomIndicator ) {
					return (
						<View style={ styles.row }>
							<View style={ verticalSeparatorStyle } />
							<TouchableWithoutFeedback
								onPress={ onCustomPress }
								accessibilityRole={ 'button' }
								accessibilityState={ {
									selected: isSelectedCustom(),
								} }
								accessibilityHint={ accessibilityHint }
							>
								<View>
									<ColorIndicator
										withCustomPicker={ ! isGradientSegment }
										color={ customIndicatorColor }
										isSelected={ isSelectedCustom() }
										style={ styles.colorIndicator }
									/>
								</View>
							</TouchableWithoutFeedback>
						</View>
					);
				}
				return null;
			} }
		/>
	);
}

export default ColorPalette;
