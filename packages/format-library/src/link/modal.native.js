
import React from 'react';
import { Button, Switch, Text, TextInput, View } from 'react-native';
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
	constructor( props ) {
		super( ...arguments );

		this.submitLink = this.submitLink.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );
		this.onChangeText = this.onChangeText.bind( this );
		this.onChangeOpensInNewWindow = this.onChangeOpensInNewWindow.bind( this );

		this.state = {
			inputValue: '',
			text: getTextContent( slice( props.value ) ),
			opensInNewWindow: false,
		};
	}

	onChangeInputValue( inputValue ) {
		this.setState( { inputValue } );
	}

	onChangeText( text ) {
		this.setState( { text } );
	}

	onChangeOpensInNewWindow( opensInNewWindow ) {
		this.setState( { opensInNewWindow } );
	}

	submitLink() {
		const { isActive, value, onChange, speak } = this.props;
		const { inputValue, opensInNewWindow, text } = this.state;
		const url = prependHTTP( inputValue );
		const format = createLinkFormat( {
			url,
			opensInNewWindow,
			text,
		} );

		if ( isCollapsed( value ) && ! isActive ) {
			const toInsert = applyFormat( create( { text } ), format, 0, text.length );
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
		const { isVisible } = this.props;

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationInTiming={ 500 }
				animationOutTiming={ 500 }
				backdropTransitionInTiming={ 500 }
				backdropTransitionOutTiming={ 500 }
				onBackdropPress={ this.props.onClose }
				onSwipe={ this.props.onClose }
				swipeDirection="down"
			>
				<View style={ { ...styles.content, borderColor: 'rgba(0, 0, 0, 0.1)' } }>
					<View style={ styles.head }>
						<Button
							color="red"
							title={ __( 'Remove' ) }
							accessibilityLabel={ __( 'Remove the link' ) }
							onPress={ this.props.onRemove }
						/>
						<View>
							<Text style={ styles.title }>
								{ __( 'Link Settings' ) }
							</Text>
						</View>
						<Button
							color="blue"
							title={ __( 'Done' ) }
							accessibilityLabel={ __( 'Finish editing the link' ) }
							onPress={ this.submitLink }
						/>
					</View>
					<View style={ styles.inlineInput }>
						<Text style={ styles.inlineInputText }>
							{ __( 'URL' ) }
						</Text>
						<URLInput
							containerStyle={ { flexGrow: 1 } }
							value={ this.state.inputValue }
							onChange={ this.onChangeInputValue }
						/>
					</View>
					<View style={ styles.inlineInput }>
						<Text style={ styles.inlineInputText }>
							{ __( 'Link Text' ) }
						</Text>
						<TextInput
							containerStyle={ { flexGrow: 1 } }
							value={ this.state.text }
							onChangeText={ this.onChangeText }
						/>
					</View>
					<View style={ styles.inlineInput }>
						<Text style={ styles.inlineInputText }>
							{ __( 'Open in a new window' ) }
						</Text>
						<Switch
							value={ this.state.opensInNewWindow }
							onValueChange={ this.onChangeOpensInNewWindow }
						/>
					</View>
				</View>
			</Modal>
		);
	};
}

export default withSpokenMessages( ModalLinkUI );
