/**
 * External dependencies
 */
import {
	ScrollView,
	TouchableWithoutFeedback,
	View,
	Text,
	Platform,
} from 'react-native';
/**
 * WordPress dependencies
 */
import {
	SETTINGS_DEFAULTS,
	__experimentalUseGradient,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
} ) {
	const isGradientSegment = currentSegment === 'Gradient';
	const isTextScreen = currentScreen === 'Text';
	const isIOS = Platform.OS === 'ios';

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

	function Swatch( { gradient } ) {
		const palette = gradient ? defaultGradientColors : defaultColors;
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
			</>
		);
	}

	const ColorSwatch = () => {
		return (
			<View style={ styles.row }>
				<Swatch gradient={ false } />
				<View style={ styles.verticalSeparator } />
				<TouchableWithoutFeedback onPress={ onCustomPress }>
					<Text style={ styles.customButton }>
						{ isIOS ? __( 'Custom' ) : __( 'CUSTOM' ) }
					</Text>
				</TouchableWithoutFeedback>
			</View>
		);
	};

	return (
		<ScrollView
			contentContainerStyle={ styles.container }
			horizontal
			showsHorizontalScrollIndicator={ false }
			keyboardShouldPersistTaps={ true }
		>
			{ isGradientSegment ? <Swatch gradient /> : <ColorSwatch /> }
		</ScrollView>
	);
}

export default ColorPalette;
