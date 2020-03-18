/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { LinearGradient } from '@wordpress/components';
import { __experimentalUseGradient } from '@wordpress/block-editor';
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

	const { gradientValue } = __experimentalUseGradient();

	return (
		<View style={ wrapperStyles }>
			{ gradientValue && (
				<LinearGradient
					gradientValue={ gradientValue }
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
