/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { RichText } from '@wordpress/block-editor';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

class PullQuote extends Component {
	render() {
		const {
			attributes,
			setAttributes,
			isSelected,
			getStylesFromColorScheme,
		} = this.props;

		const { value, citation } = attributes;

		const wpBlockPullquote = getStylesFromColorScheme(
			styles.wpBlockPullquoteLight,
			styles.wpBlockPullquoteDark
		);

		return (
			<View style={ wpBlockPullquote }>
				<RichText
					value={ value }
					placeholder={
						// translators: placeholder text used for the quote
						__( 'Write quote…' )
					}
					onChange={ ( nextValue ) =>
						setAttributes( {
							value: nextValue,
						} )
					}
					style={ styles.wpBlockPullquoteQuote }
					textAlign="center"
				/>
				{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
					<RichText
						__unstableMobileNoFocusOnMount={ true }
						value={ citation }
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Write citation…' )
						}
						onChange={ ( nextCitation ) =>
							setAttributes( {
								citation: nextCitation,
							} )
						}
						style={ styles.wpBlockPullquoteCitation }
						textAlign="center"
					/>
				) }
			</View>
		);
	}
}

export default withPreferredColorScheme( PullQuote );
