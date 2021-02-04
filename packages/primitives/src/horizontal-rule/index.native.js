/**
 * External dependencies
 */
import Hr from 'react-native-hr';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const HR = ( { getStylesFromColorScheme, style, ...props } ) => {
	const lineStyle = getStylesFromColorScheme( styles.line, styles.lineDark );
	const customBackground = style?.backgroundColor
		? { backgroundColor: style.backgroundColor }
		: {};

	return (
		<View
			style={ {
				marginTop: style?.marginTop,
				marginBottom: style?.marginBottom,
			} }
		>
			<Hr
				{ ...props }
				lineStyle={ {
					...lineStyle,
					...props.lineStyle,
					...customBackground,
				} }
				marginLeft={ 0 }
				marginRight={ 0 }
			/>
		</View>
	);
};

export const HorizontalRule = withPreferredColorScheme( HR );
