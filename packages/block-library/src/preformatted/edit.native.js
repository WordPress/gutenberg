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
import WebPreformattedEdit from './edit.js';
import styles from './styles.scss';

export default function PreformattedEdit( props ) {
	const { style } = props;

	const textBaseStyle = usePreferredColorSchemeStyle(
		styles.wpRichTextLight,
		styles.wpRichTextDark
	);
	const wpBlockPreformatted = usePreferredColorSchemeStyle(
		styles.wpBlockPreformattedLight,
		styles.wpBlockPreformattedDark
	);
	const richTextStyle = {
		...( ! style?.baseColors && textBaseStyle ),
		...( style?.fontSize && { fontSize: style.fontSize } ),
		...( style?.color && { color: style.color } ),
	};
	const hasBaseColors =
		style?.baseColors && Object.entries( style.baseColors ).length !== 0;
	const containerStyles = [
		wpBlockPreformatted,
		style?.backgroundColor && { backgroundColor: style.backgroundColor },
		hasBaseColors &&
			! style?.backgroundColor &&
			styles[ 'wp-block-preformatted__no-background' ],
	];

	const propsWithStyle = {
		...props,
		style: richTextStyle,
	};
	return (
		<View style={ containerStyles }>
			<WebPreformattedEdit { ...propsWithStyle } />
		</View>
	);
}
