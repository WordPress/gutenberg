/**
 * External dependencies
 */
import { Platform, View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PlainText } from '@wordpress/block-editor';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */

import styles from './style.scss';

export function ShortcodeEdit( props ) {
	const {
		attributes,
		setAttributes,
		onFocus,
		onBlur,
		getStylesFromColorScheme,
	} = props;
	const titleStyle = getStylesFromColorScheme(
		styles.blockTitle,
		styles.blockTitleDark
	);
	const shortcodeStyle = getStylesFromColorScheme(
		styles.blockShortcode,
		styles.blockShortcodeDark
	);
	const placeholderStyle = getStylesFromColorScheme(
		styles.placeholder,
		styles.placeholderDark
	);

	return (
		<View>
			<Text style={ titleStyle }>{ __( 'Shortcode' ) }</Text>
			<PlainText
				value={ attributes.text }
				style={ shortcodeStyle }
				multiline={ true }
				underlineColorAndroid="transparent"
				onChange={ ( text ) => setAttributes( { text } ) }
				placeholder={ __( 'Add a shortcode…' ) }
				aria-label={ __( 'Shortcode' ) }
				isSelected={ props.isSelected }
				onFocus={ onFocus }
				onBlur={ onBlur }
				autoCorrect={ false }
				autoComplete="off"
				/*
				 * For some devices autoCorrect and autoComplete are not enough to hide the suggestion toolbar.
				 * Following the suggestion below we added the keyboard type as well.
				 * https://stackoverflow.com/questions/37001070/how-to-avoid-the-suggestions-of-keyboard-for-android-in-react-native/51411575#51411575
				 */
				keyboardType={
					Platform.OS === 'ios' ? 'default' : 'visible-password'
				}
				placeholderTextColor={ placeholderStyle.color }
			/>
		</View>
	);
}

export default withPreferredColorScheme( ShortcodeEdit );
