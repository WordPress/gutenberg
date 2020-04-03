/**
 * External dependencies
 */
import { View, Animated } from 'react-native';
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

function SelectedIcon( { opacity } ) {
	return (
		<Animated.View style={ [ styles.selected, { opacity } ] }>
			<View style={ [ styles.outline, styles.selectedOutline ] } />
			<Icon icon={ check } style={ styles.icon } size={ 24 } />
		</Animated.View>
	);
}

function ColorIndicator( {
	color,
	isSelected,
	custom,
	style,
	getStylesFromColorScheme,
	opacity,
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
				<View style={ styles.outline } />
				{ isSelected && <SelectedIcon opacity={ opacity } /> }
			</LinearGradient>
		);
	} else if ( custom ) {
		return (
			<View style={ [ circleStyle, style ] }>
				<View style={ styles.outline } />
				{ color.map( ( gradientValue ) => {
					return (
						<LinearGradient
							gradientValue={ gradientValue }
							style={ [ circleStyle, styles.absolute ] }
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
			<View style={ styles.outline } />
			{ isSelected && <SelectedIcon opacity={ opacity } /> }
		</View>
	);
}
export default withPreferredColorScheme( ColorIndicator );
