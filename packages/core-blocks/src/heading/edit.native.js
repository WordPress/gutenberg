/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { RichText } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';

const minHeight = 50;

class HeadingEdit extends Component {
	render() {
		const {
			attributes,
			setAttributes,
		} = this.props;

		const {
			level,
			placeholder,
		} = attributes;

		const tagName = 'h' + level;

		return (
			<View>
				<RichText
					tagName={ tagName }
					content={ { contentTree: attributes.content, eventCount: attributes.eventCount } }
					style={ {
						minHeight: Math.max( minHeight, typeof attributes.aztecHeight === 'undefined' ? 0 : attributes.aztecHeight ),
					} }
					onChange={ ( value ) => {
						setAttributes( value );
					} }
					onContentSizeChange={ ( event ) => {
						setAttributes( { aztecHeight: event.aztecHeight } );
					} }
					placeholder={ placeholder || __( 'Write heading…' ) }
				/>
			</View>
		);
	}
}
export default HeadingEdit;
