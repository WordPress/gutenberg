/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */

// import styles from './theme.scss';

// Note: styling is applied directly to the (nested) PlainText component. Web-side components
// apply it to the container 'div' but we don't have a proper proposal for cascading styling yet.
export function CodeEdit( props ) {
	const {
		attributes,
		mergeBlocks,
		setAttributes,
		onRemove,
		// getStylesFromColorScheme,
	} = props;
	// const codeStyle = getStylesFromColorScheme(
	// 	styles.blockCode,
	// 	styles.blockCodeDark
	// );
	// const placeholderStyle = getStylesFromColorScheme(
	// 	styles.placeholder,
	// 	styles.placeholderDark
	// );

	const blockProps = useBlockProps();

	return (
		<View
		// style={ codeStyle }
		>
			<RichText
				tagName="code"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				onRemove={ onRemove }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				preserveWhiteSpace
				__unstablePastePlainText
				//
				// From preformatted edit.js
				identifier="content"
				onMerge={ mergeBlocks }
				{ ...blockProps }
			/>
		</View>
	);
}

export default withPreferredColorScheme( CodeEdit );
