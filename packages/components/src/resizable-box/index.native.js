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
import styles from './style.scss';

function ResizableBox( props ) {
	const { size, showHandle = true, getStylesFromColorScheme } = props;
	const { height } = size;
	const defaultStyle = getStylesFromColorScheme(
		styles.staticSpacer,
		styles.staticDarkSpacer
	);
	return (
		<View
			style={ [
				defaultStyle,
				showHandle && styles.selectedSpacer,
				{ height },
			] }
		></View>
	);
}

export default withPreferredColorScheme( ResizableBox );
