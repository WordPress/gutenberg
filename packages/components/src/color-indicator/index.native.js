/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';
import { LinearGradient } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';

function SelectedIcon() {
	return (
		<View style={ styles.selected }>
			<Icon icon={ check } />
		</View>
	);
}

function ColorIndicator( {
	color,
	isSelected,
	custom,
	style,
	getStylesFromColorScheme,
} ) {
	const isGradient = color.includes( 'linear-gradient' );

	const circleStyle = getStylesFromColorScheme(
		styles.circleOption,
		styles.circleOptionDark
	);

	if ( isGradient ) {
		return (
			<LinearGradient
				style={ [ circleStyle, style ] }
				gradientValue={ color }
			>
				{ isSelected && <SelectedIcon /> }
			</LinearGradient>
		);
	} else if ( custom ) {
		return (
			<View style={ circleStyle }>
				{ color.map( ( gradientValue ) => {
					return (
						<LinearGradient
							gradientValue={ gradientValue }
							style={ [ circleStyle, style, styles.absolute ] }
							key={ gradientValue }
						/>
					);
				} ) }
				{ isSelected && <SelectedIcon /> }
			</View>
		);
	}
	return (
		<View style={ [ circleStyle, style, { backgroundColor: color } ] }>
			{ isSelected && <SelectedIcon /> }
		</View>
	);
}
export default withPreferredColorScheme( ColorIndicator );
