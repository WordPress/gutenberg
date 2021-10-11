/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */

/**
 * Block code style
 */
import styles from './theme.scss';

// Note: styling is applied directly to the (nested) PlainText component. Web-side components
// apply it to the container 'div' but we don't have a proper proposal for cascading styling yet.
export function CodeEdit( props ) {
	const { attributes, setAttributes, onFocus, onBlur, style } = props;
	const codeStyle = {
		...usePreferredColorSchemeStyle(
			styles.blockCode,
			styles.blockCodeDark
		),
		...( style?.fontSize && { fontSize: style.fontSize } ),
	};

	const placeholderStyle = usePreferredColorSchemeStyle(
		styles.placeholder,
		styles.placeholderDark
	);

	return (
		<View>
			<PlainText
				value={ attributes.content }
				style={ codeStyle }
				multiline={ true }
				underlineColorAndroid="transparent"
				onChange={ ( content ) => setAttributes( { content } ) }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				isSelected={ props.isSelected }
				onFocus={ onFocus }
				onBlur={ onBlur }
				placeholderTextColor={ placeholderStyle.color }
			/>
		</View>
	);
}

export default CodeEdit;
