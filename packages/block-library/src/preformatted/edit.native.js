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
import WebPreformattedEdit from './edit.js';
import styles from './styles.scss';

function PreformattedEdit( props ) {
	const { getStylesFromColorScheme } = props;
	const richTextStyle = getStylesFromColorScheme(
		styles.wpRichTextLight,
		styles.wpRichTextDark
	);
	const wpBlockPreformatted = getStylesFromColorScheme(
		styles.wpBlockPreformattedLight,
		styles.wpBlockPreformattedDark
	);
	const propsWithStyle = {
		...props,
		style: richTextStyle,
	};
	return (
		<View style={ wpBlockPreformatted }>
			<WebPreformattedEdit { ...propsWithStyle } />
		</View>
	);
}

export default withPreferredColorScheme( PreformattedEdit );
