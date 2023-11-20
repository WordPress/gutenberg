/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const HR = ( {
	getStylesFromColorScheme,
	lineStyle,
	marginLeft,
	marginRight,
	style,
	textStyle,
	text,
	...props
} ) => {
	const renderLine = ( key ) => (
		<View
			key={ key }
			style={ [
				getStylesFromColorScheme( styles.line, styles.lineDark ),
				lineStyle,
			] }
		/>
	);

	const renderText = ( key ) => (
		<View key={ key } style={ styles.textContainer }>
			<Text style={ [ styles.text, textStyle ] }>{ text }</Text>
		</View>
	);

	const renderInner = () => {
		if ( ! text ) {
			return renderLine();
		}
		return [ renderLine( 1 ), renderText( 2 ), renderLine( 3 ) ];
	};

	return (
		<View
			style={ [ styles.container, { marginLeft, marginRight }, style ] }
			{ ...props }
		>
			{ renderInner() }
		</View>
	);
};

export const HorizontalRule = withPreferredColorScheme( HR );
