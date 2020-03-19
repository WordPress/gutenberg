/**
 * External dependencies
 */
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	SETTINGS_DEFAULTS,
	__experimentalUseGradient,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
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

	const isGradientSegment = currentSegment === 'Gradient';
	const isTextScreen = currentScreen === 'Text';

	const { setGradient } = __experimentalUseGradient( {}, clientId );

	const [ activeBgColor, setActiveBgColor ] = useState( backgroundColor );
	const [ activeTextColor, setActiveTextColor ] = useState( textColor );

	const defaultColors = SETTINGS_DEFAULTS.colors;
	const defaultGradientColors = SETTINGS_DEFAULTS.gradients;

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
		return (
			<>
				{ palette.map( ( color ) => {
					const paletteColor = gradient
						? color.gradient
						: color.color;
					const isSelected =
						paletteColor === activeBgColor ||
						paletteColor === activeTextColor;
					return (
						<TouchableWithoutFeedback
							onPress={ () => onColorPress( paletteColor ) }
							key={ paletteColor }
						>
							<View>
								<ColorIndicator
									color={ paletteColor }
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
			contentContainerStyle={ styles.container }
			horizontal
			showsHorizontalScrollIndicator={ false }
			keyboardShouldPersistTaps={ true }
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
