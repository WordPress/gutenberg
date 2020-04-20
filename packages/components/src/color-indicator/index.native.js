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
	withCustomPicker,
	style,
	getStylesFromColorScheme,
	opacity,
} ) {
	const isGradient = color?.includes( 'linear-gradient' );

	const outlineStyle = getStylesFromColorScheme(
		styles.outline,
		styles.outlineDark
	);

	if ( isGradient ) {
		return (
			<LinearGradient
				style={ [ styles.circleOption, style ] }
				gradientValue={ color }
			>
				<View style={ outlineStyle } />
				{ isSelected && <SelectedIcon opacity={ opacity } /> }
			</LinearGradient>
		);
	} else if ( withCustomPicker ) {
		return (
			<View style={ [ styles.circleOption, style ] }>
				<View style={ outlineStyle } />
				{ color.map( ( gradientValue ) => {
					return (
						<LinearGradient
							gradientValue={ gradientValue }
							style={ [ styles.circleOption, styles.absolute ] }
							key={ gradientValue }
						/>
					);
				} ) }
				{ isSelected && <SelectedIcon /> }
			</View>
		);
	}
	return (
		<View
			style={ [ styles.circleOption, style, { backgroundColor: color } ] }
		>
			<View style={ outlineStyle } />
			{ isSelected && <SelectedIcon opacity={ opacity } /> }
		</View>
	);
}
export default withPreferredColorScheme( ColorIndicator );
