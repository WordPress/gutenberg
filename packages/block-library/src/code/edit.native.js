/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PlainText } from '@wordpress/editor';

/**
 * Block code style
 */
import styles from './theme.scss';

// Note: styling is applied directly to the (nested) PlainText component. Web-side components
// apply it to the container 'div' but we don't have a proper proposal for cascading styling yet.
export default function CodeEdit( props ) {
	const { attributes, setAttributes, style, onFocus, onBlur } = props;

	return (
		<View>
			<PlainText
				value={ attributes.content }
				style={ [ style, styles.blockCode ] }
				multiline={ true }
				underlineColorAndroid="transparent"
				onChange={ ( content ) => setAttributes( { content } ) }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				isSelected={ props.isSelected }
				onFocus={ onFocus }
				onBlur={ onBlur }
			/>
		</View>
	);
}

