/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { LinearGradient } from '@wordpress/components';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColorBackground( { children, borderRadiusValue, backgroundColor } ) {
	const wrapperStyles = [
		styles.richTextWrapper,
		{
			borderRadius: borderRadiusValue,
			backgroundColor,
		},
	];

	const isGradient = backgroundColor.includes( 'linear-gradient' );

	return (
		<View style={ wrapperStyles }>
			{ isGradient && (
				<LinearGradient
					gradientValue={ backgroundColor }
					angleCenter={ { x: 0.5, y: 0.5 } }
					style={ [
						styles.linearGradient,
						{ borderRadius: borderRadiusValue },
					] }
				/>
			) }
			{ children }
		</View>
	);
}

export default ColorBackground;
