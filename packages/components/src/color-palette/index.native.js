/**
 * External dependencies
 */
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import { map } from 'lodash';
/**
 * WordPress dependencies
 */
import {
	SETTINGS_DEFAULTS,
	__experimentalUseGradient,
} from '@wordpress/block-editor';
import { useState, useEffect, createRef } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';
import ColorIndicator from '../color-indicator';

function ColorPalette( {
	setBackgroundColor,
	setTextColor,
	backgroundColor,
	textColor,
	clientId,
	currentSegment,
	currentScreen,
	onCustomPress,
	getStylesFromColorScheme,
} ) {
	const customSwatchGradients = [
		'linear-gradient(120deg, rgba(255,0,0,.8), 0%, rgba(255,255,255,1) 70.71%)',
		'linear-gradient(240deg, rgba(0,255,0,.8), 0%, rgba(0,255,0,0) 70.71%)',
		'linear-gradient(360deg, rgba(0,0,255,.8), 0%, rgba(0,0,255,0) 70.71%)',
	];

	const scrollViewRef = createRef();

	const isGradientSegment = currentSegment === 'Gradient';
	const isTextScreen = currentScreen === 'Text';

	const { setGradient } = __experimentalUseGradient( {}, clientId );

	const [ activeBgColor, setActiveBgColor ] = useState( backgroundColor );
	const [ activeTextColor, setActiveTextColor ] = useState( textColor );

	const defaultColors = map( SETTINGS_DEFAULTS.colors, 'color' );
	const defaultGradientColors = map(
		SETTINGS_DEFAULTS.gradients,
		'gradient'
	);

	useEffect( () => {
		scrollViewRef.current.scrollTo( { x: 0, y: 0 } );
	}, [ currentSegment ] );

	function onColorPress( value ) {
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

	function Swatch( { gradient, custom } ) {
		const palette = gradient ? defaultGradientColors : defaultColors;
		const verticalSeparatorStyle = getStylesFromColorScheme(
			styles.verticalSeparator,
			styles.verticalSeparatorDark
		);
		const isSelectedCustomBgColor =
			! defaultColors.includes( activeBgColor ) &&
			! defaultGradientColors.includes( activeBgColor );
		const isSelectedCustomTextColor = ! defaultColors.includes(
			activeTextColor
		);
		const isSelectedCustom = isTextScreen
			? isSelectedCustomTextColor
			: isSelectedCustomBgColor;
		return (
			<>
				{ palette.map( ( color ) => {
					const isSelectedBgColor = color === activeBgColor;
					const isSelectedTextColor = color === activeTextColor;
					const isSelected = isTextScreen
						? isSelectedTextColor
						: isSelectedBgColor;
					return (
						<TouchableWithoutFeedback
							onPress={ () => onColorPress( color ) }
							key={ color }
						>
							<View>
								<ColorIndicator
									color={ color }
									gradient
									isSelected={ isSelected }
								/>
							</View>
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
									isSelected={ isSelectedCustom }
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
			keyboardShouldPersistTaps={ true }
			ref={ scrollViewRef }
		>
			{ isGradientSegment ? (
				<Swatch gradient />
			) : (
				<Swatch custom onCustomPress={ onCustomPress } />
			) }
		</ScrollView>
	);
}

export default withPreferredColorScheme( ColorPalette );
