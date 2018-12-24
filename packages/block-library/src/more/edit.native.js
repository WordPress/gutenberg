/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	getDefaultBlockName,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { PlainText } from '@wordpress/editor';
import styles from './editor.scss';

export default class MoreEdit extends Component {
	constructor() {
		super( ...arguments );
		this.onChangeInput = this.onChangeInput.bind( this );
		this.onEnter = this.onEnter.bind( this );

		this.state = {
			defaultText: __( 'Read more' ),
		};
	}

	onChangeInput( newValue ) {
		// Set defaultText to an empty string, allowing the user to clear/replace the input field's text
		this.setState( {
			defaultText: '',
		} );
		const value = newValue.length === 0 ? undefined : newValue;
		this.props.setAttributes( { customText: value } );
	}

	onEnter( ) {
		const { insertBlocksAfter } = this.props;
		insertBlocksAfter( [ createBlock( getDefaultBlockName() ) ] );
	}

	renderLine() {
		return <View style={ styles[ 'block-library-more__line' ] } />;
	}

	renderText() {
		const { attributes, onFocus, onBlur } = this.props;
		const { customText } = attributes;
		const { defaultText } = this.state;
		const value = customText !== undefined ? customText : defaultText;

		return (
			<View>
				<PlainText
					style={ styles[ 'block-library-more__text' ] }
					value={ value }
					multiline={ false }
					onSubmitEditing={ this.onEnter }
					underlineColorAndroid="transparent"
					onChange={ this.onChangeInput }
					placeholder={ defaultText }
					isSelected={ this.props.isSelected }
					onFocus={ onFocus }
					onBlur={ onBlur }
				/>
			</View>
		);
	}

	render() {
		return (
			<View style={ styles[ 'block-library-more__container' ] }>
				{ this.renderLine() }
				{ this.renderText() }
				{ this.renderLine() }
			</View>
		);
	}
}
