/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { prependHTTP } from '@wordpress/url';
import {
	BottomSheet,
	BottomSheetConsumer,
	LinkPicker,
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
import { external, textColor } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';

import styles from './modal.scss';

class ModalLinkUI extends Component {
	constructor() {
		super( ...arguments );

		this.submitLink = this.submitLink.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );
		this.onChangeText = this.onChangeText.bind( this );
		this.onChangeOpensInNewWindow = this.onChangeOpensInNewWindow.bind(
			this
		);
		this.removeLink = this.removeLink.bind( this );
		this.onDismiss = this.onDismiss.bind( this );

		this.state = {
			inputValue: '',
			text: '',
			opensInNewWindow: false,
			isFullScreen: false,
		};
	}

	componentDidUpdate( oldProps ) {
		if ( oldProps === this.props ) {
			return;
		}

		const {
			activeAttributes: { url, target },
		} = this.props;
		const opensInNewWindow = target === '_blank';

		this.setState( {
			inputValue: url || '',
			text: getTextContent( slice( this.props.value ) ),
			opensInNewWindow,
		} );
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
		const { isActive, onChange, speak, value } = this.props;
		const { inputValue, opensInNewWindow, text } = this.state;
		const url = prependHTTP( inputValue );
		const linkText = text || inputValue;
		const format = createLinkFormat( {
			url,
			opensInNewWindow,
			text: linkText,
		} );
		let newAttributes;
		if ( isCollapsed( value ) && ! isActive ) {
			// insert link
			const toInsert = applyFormat(
				create( { text: linkText } ),
				format,
				0,
				linkText.length
			);
			newAttributes = insert( value, toInsert );
		} else if ( text !== getTextContent( slice( value ) ) ) {
			// edit text in selected link
			const toInsert = applyFormat(
				create( { text } ),
				format,
				0,
				text.length
			);
			newAttributes = insert( value, toInsert, value.start, value.end );
		} else {
			// transform selected text into link
			newAttributes = applyFormat( value, format );
		}
		//move selection to end of link
		newAttributes.start = newAttributes.end;
		newAttributes.activeFormats = [];
		onChange( { ...newAttributes, needsSelectionUpdate: true } );

		if ( ! isValidHref( url ) ) {
			speak(
				__(
					'Warning: the link has been inserted but may have errors. Please test it.'
				),
				'assertive'
			);
		} else if ( isActive ) {
			speak( __( 'Link edited.' ), 'assertive' );
		} else {
			speak( __( 'Link inserted' ), 'assertive' );
		}

		this.props.onClose();
	}

	removeLink() {
		this.props.onRemove();
		this.props.onClose();
	}

	onDismiss() {
		if ( this.state.inputValue === '' ) {
			this.removeLink();
		} else {
			this.submitLink();
		}
		this.setState( { isFullScreen: false } );
	}

	render() {
		const { isVisible } = this.props;
		const { inputValue, isFullScreen, text } = this.state;

		return (
			<BottomSheet
				isVisible={ isVisible }
				onClose={ this.onDismiss }
				hideHeader
				style={ { flex: isFullScreen ? 1 : undefined } }
			>
				<BottomSheetConsumer>
					{ ( {
						currentScreen: subsheet,
						onReplaceSubsheet: replaceSubsheet,
						onHardwareButtonPress: setBackHandler,
						shouldDisableBottomSheetMaxHeight: setMaxHeightEnabled,
						} ) => {

							// subsheet depth is limited to 1 so we can revert to default
							// back behavior when returning from the subsheet
							const goBack = () => {
								replaceSubsheet( null, {}, () => setBackHandler( null ) );
								this.setState( { isFullScreen: false } )
							}

							// we only set text to title if there was no initial text
							const onLinkPicked = ( { url, title } ) => {
								if ( ! text ) {
									this.setState( { inputValue: url, text: title } );
								} else {
									this.setState( { inputValue: url } );
								}
								goBack();
							};

							switch ( subsheet ) {
								case 'picker':
									return (
										<LinkPicker
											value={ inputValue }
											onLinkPicked={ onLinkPicked }
											onCancel={ goBack }
										/>
									);
								default:
									return (
										<>
											<BottomSheet.LinkCell
												value={ inputValue }
												onPress={ () => {
													setMaxHeightEnabled( false );
													this.setState( { isFullScreen: true } );
													replaceSubsheet( 'picker', {}, () => {
														setBackHandler( goBack );
													} );
												} }
											/>
											<BottomSheet.Cell
												icon={ textColor }
												label={ __( 'Link text' ) }
												value={ text }
												placeholder={ __( 'Add link text' ) }
												onChangeValue={ this.onChangeText }
												onSubmit={ this.onDismiss }
											/>
											<BottomSheet.SwitchCell
												icon={ external }
												label={ __( 'Open in new tab' ) }
												value={ this.state.opensInNewWindow }
												onValueChange={ this.onChangeOpensInNewWindow }
												separatorType={ 'fullWidth' }
											/>
											<BottomSheet.Cell
												label={ __( 'Remove link' ) }
												labelStyle={ styles.clearLinkButton }
												separatorType={ 'none' }
												onPress={ this.removeLink }
											/>
										</>
									);
							}
						} }
				</BottomSheetConsumer>
			</BottomSheet>
		);
	}
}

export default withSpokenMessages( ModalLinkUI );
