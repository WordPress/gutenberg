/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function HRLine( { color, lineStyle } ) {
	const lineStyles = [
		styles.hr__line,
		lineStyle,
		color && { backgroundColor: color },
	];
	return <View style={ lineStyles } />;
}

function HRText( { text, textStyle } ) {
	const textStyles = [ styles.hr__text, textStyle ];
	return <Text style={ textStyles }>{ text }</Text>;
}

function HR( {
	color,
	lineStyle,
	marginLeft = 8,
	marginRight = 8,
	text,
	textStyle,
} ) {
	const containerStyles = [
		styles.hr__container,
		{
			marginLeft,
			marginRight,
		},
	];

	if ( ! text ) {
		return (
			<View style={ containerStyles }>
				<HRLine color={ color } lineStyle={ lineStyle } />
			</View>
		);
	}

	return (
		<View style={ containerStyles }>
			<HRLine color={ color } lineStyle={ lineStyle } />
			<HRText color={ color } text={ text } textStyle={ textStyle } />
			<HRLine color={ color } lineStyle={ lineStyle } />
		</View>
	);
}

export default HR;
