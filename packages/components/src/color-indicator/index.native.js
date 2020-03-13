/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';
import { LinearGradient } from '@wordpress/components';
/**
 * Internal dependencies
 */
import styles from './style.scss';

function ColorIndicator( { color, isSelected, gradient, style } ) {
	const SelectedIcon = () => (
		<View style={ styles.selected }>
			<Icon icon={ check } />
		</View>
	);

	if ( gradient ) {
		return (
			<LinearGradient
				style={ [ styles.circleOption, style ] }
				gradientValue={ color }
			>
				{ isSelected && <SelectedIcon /> }
			</LinearGradient>
		);
	}
	return (
		<View
			style={ [ styles.circleOption, style, { backgroundColor: color } ] }
		>
			{ isSelected && <SelectedIcon /> }
		</View>
	);
}
export default ColorIndicator;
