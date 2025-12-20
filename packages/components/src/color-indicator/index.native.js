/**
 * External dependencies
 */
import { View, Animated } from 'react-native';
/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';
import Gradient from '../mobile/gradient';
import { colorsUtils } from '../mobile/color-settings/utils';

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
	opacity,
} ) {
	const { isGradient } = colorsUtils;

	const outlineStyle = usePreferredColorSchemeStyle(
		styles.outline,
		styles.outlineDark
	);

	if ( isGradient( color ) ) {
		return (
			<Gradient
				style={ [ styles.circleOption, style ] }
				gradientValue={ color }
			>
				<View style={ outlineStyle } />
				{ isSelected && <SelectedIcon opacity={ opacity } /> }
			</Gradient>
		);
	} else if ( withCustomPicker ) {
		return (
			<View style={ [ styles.circleOption, style ] }>
				<View style={ outlineStyle } />
				{ color.map( ( gradientValue ) => {
					return (
						<Gradient
							gradientValue={ gradientValue }
							style={ [
								styles.circleOption,
								styles.absolute,
								style,
							] }
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
export default ColorIndicator;
