
import React from 'react';
import { View, Text } from 'react-native';
import Modal from 'react-native-modal';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { URLInput } from '@wordpress/editor';
import { prependHTTP, safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import {
	withSpokenMessages,
} from '@wordpress/components';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
	getTextContent,
	slice,
} from '@wordpress/rich-text';

import { createLinkFormat, isValidHref } from './utils';

import styles from './modal.scss';

class ModalLinkUI extends Component {
	constructor() {
		super( ...arguments );

		this.submitLink = this.submitLink.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );

		this.state = {
			inputValue: '',
			opensInNewWindow: false,
		};
	}

	onChangeInputValue( inputValue ) {
		this.setState( { inputValue } );
	}

	submitLink() {
		const { isActive, value, onChange, speak } = this.props;
		const { inputValue, opensInNewWindow } = this.state;
		const url = prependHTTP( inputValue );
		const selectedText = getTextContent( slice( value ) );
		const format = createLinkFormat( {
			url,
			opensInNewWindow,
			text: selectedText,
		} );

		if ( isCollapsed( value ) && ! isActive ) {
			const toInsert = applyFormat( create( { text: url } ), format, 0, url.length );
			onChange( insert( value, toInsert ) );
		} else {
			onChange( applyFormat( value, format ) );
		}

		if ( ! isValidHref( url ) ) {
			speak( __( 'Warning: the link has been inserted but may have errors. Please test it.' ), 'assertive' );
		} else if ( isActive ) {
			speak( __( 'Link edited.' ), 'assertive' );
		} else {
			speak( __( 'Link inserted' ), 'assertive' );
		}

		this.props.onClose();
	}

	render() {
		const { value, isVisible } = this.props;

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationInTiming={ 500 }
				animationOutTiming={ 500 }
				backdropTransitionInTiming={ 500 }
				backdropTransitionOutTiming={ 500 }
				onBackdropPress={ this.submitLink }
				onSwipe={ this.submitLink }
				swipeDirection="down"
			>
				<View style={ { ...styles.content, borderColor: 'rgba(0, 0, 0, 0.1)' } }>
					<URLInput value={ this.state.inputValue } onChange={ this.onChangeInputValue } />
					<Text>{ value.text }</Text>
				</View>
			</Modal>
		);
	};
}

export default withSpokenMessages( ModalLinkUI );
