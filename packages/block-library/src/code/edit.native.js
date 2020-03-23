/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';
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
	const { attributes, setAttributes, getStylesFromColorScheme } = props;
	const codeStyle = getStylesFromColorScheme(
		styles.blockCode,
		styles.blockCodeDark
	);

	return (
		<View style={ codeStyle }>
			<RichText
				tagName="pre"
				preserveWhiteSpace
				value={ attributes.content }
				onChange={ ( nextContent ) => {
					const cleanContent = nextContent.replace(
						RegExp( '<br>', 'gim' ),
						'\n'
					);
					setAttributes( {
						content: cleanContent,
					} );
				} }
				placeholder={ __( 'Write code…' ) }
				style={ codeStyle }
			/>
		</View>
	);
}

export default withPreferredColorScheme( CodeEdit );
