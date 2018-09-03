/**
 * External dependencies
 */
import { View } from 'react-native';
import { range } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { RichText } from '@wordpress/editor';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';

const minHeight = 50;

class HeadingEdit extends Component {
	createLevelControl( targetLevel ) {
		const {
			attributes,
			setAttributes,
		} = this.props;

		const {
			level,
		} = attributes;

		return {
			icon: 'heading',
			// translators: %s: heading level e.g: "1", "2", "3"
			title: sprintf( __( 'Heading %d' ), targetLevel ),
			isActive: targetLevel === level,
			onClick: () => setAttributes( { level: targetLevel } ),
			subscript: String( targetLevel ),
		};
	}

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
				<Toolbar controls={ range( 2, 5 ).map( this.createLevelControl.bind( this ) ) } />
				<RichText
					tagName={ tagName }
					content={ { contentTree: attributes.content } }
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
