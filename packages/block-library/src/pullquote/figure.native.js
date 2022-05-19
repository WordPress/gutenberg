/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './figure.scss';

export const Figure = ( { children, backgroundColor, borderColor } ) => {
	const wpPullquoteFigure = usePreferredColorSchemeStyle(
		styles.light,
		styles.dark
	);

	const customStyles = {};
	if ( borderColor ) {
		customStyles.borderTopColor = borderColor;
		customStyles.borderBottomColor = borderColor;
	}

	if ( backgroundColor ) {
		customStyles.backgroundColor = backgroundColor;
	}

	return (
		<View style={ [ wpPullquoteFigure, customStyles ] }>{ children }</View>
	);
};
