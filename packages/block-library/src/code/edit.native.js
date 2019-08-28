/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { withTheme, useStyle } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { escape, unescape } from './utils';

/**
 * Block code style
 */
import styles from './theme.scss';

// Note: styling is applied directly to the (nested) PlainText component. Web-side components
// apply it to the container 'div' but we don't have a proper proposal for cascading styling yet.
export function CodeEdit( props ) {
	const { attributes, setAttributes, style, onFocus, onBlur, theme } = props;
	const codeStyle = useStyle( styles.blockCode, styles.blockCodeDark, theme );
	const placeholderStyle = useStyle( styles.placeholder, styles.placeholderDark, theme );

	return (
		<View>
			<PlainText
				value={ unescape( attributes.content ) }
				style={ [ style, codeStyle ] }
				multiline={ true }
				underlineColorAndroid="transparent"
				onChange={ ( content ) => setAttributes( { content: escape( content ) } ) }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				isSelected={ props.isSelected }
				onFocus={ onFocus }
				onBlur={ onBlur }
				fontFamily={ ( styles.blockCode.fontFamily ) }
				placeholderTextColor={ placeholderStyle.color }
			/>
		</View>
	);
}

export default withTheme( CodeEdit );
