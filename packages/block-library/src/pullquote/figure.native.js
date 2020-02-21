/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './figure.scss';

export const Figure = withPreferredColorScheme( ( props ) => {
	const { children, getStylesFromColorScheme } = props;

	const wpPullquoteFigure = getStylesFromColorScheme(
		styles.light,
		styles.dark
	);

	return <View style={ wpPullquoteFigure }>{ children }</View>;
} );
