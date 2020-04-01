/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const BlockInsertionPoint = ( { getStylesFromColorScheme } ) => {
	const lineStyle = getStylesFromColorScheme(
		styles.lineStyleAddHere,
		styles.lineStyleAddHereDark
	);
	const labelStyle = getStylesFromColorScheme(
		styles.labelStyleAddHere,
		styles.labelStyleAddHereDark
	);

	return (
		<View style={ styles.containerStyleAddHere }>
			<View style={ lineStyle }></View>
			<Text style={ labelStyle }>{ __( 'ADD BLOCK HERE' ) }</Text>
			<View style={ lineStyle }></View>
		</View>
	);
};

export default withPreferredColorScheme( BlockInsertionPoint );
