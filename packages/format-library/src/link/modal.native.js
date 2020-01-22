/**
 * External dependencies
 */
import React from 'react';
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { prependHTTP } from '@wordpress/url';
import {
	BottomSheet,
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

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';
import LinkRelIcon from './link-rel';

import styles from './modal.scss';

export class ModalLinkUI extends Component {
	constructor() {
		super( ...arguments );

		this.submitLink = this.submitLink.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );
		this.onChangeText = this.onChangeText.bind( this );
		this.onChangeOpensInNewWindow = this.onChangeOpensInNewWindow.bind( this );
		this.removeLink = this.removeLink.bind( this );
		this.onDismiss = this.onDismiss.bind( this );
		this.onSetLinkRel = this.onSetLinkRel.bind( this );

		this.state = {
			inputValue: '',
			text: '',
			opensInNewWindow: false,
			linkRel: '',
		};
	}

	componentDidUpdate( oldProps ) {
		if ( oldProps === this.props ) {
			return;
		}

		const { activeAttributes: { url, target }, value, selectedBlockAttributes } = this.props;
		const opensInNewWindow = target === '_blank' || selectedBlockAttributes.linkTarget === '_blank';
		this.setState( {
			inputValue: selectedBlockAttributes.url || url || '',
			text: getTextContent( slice( value ) ),
			linkRel: selectedBlockAttributes.rel || '',
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

	onSetLinkRel( linkRel ) {
		this.setState( { linkRel } );
	}

	submitLink() {
		const { isActive, onChange, speak, value, isSelectedButtonBlock, onBlockAttributesChange, selectedBlockClientId } = this.props;
		const { inputValue, opensInNewWindow, text, linkRel } = this.state;
		const url = prependHTTP( inputValue );
		const linkText = text || inputValue;
		const format = createLinkFormat( {
			url,
			opensInNewWindow,
			text: linkText,
		} );

		if ( isSelectedButtonBlock ) {
			const attributes = { url, rel: linkRel, linkTarget: opensInNewWindow ? '_blank' : undefined };
			onBlockAttributesChange( selectedBlockClientId, attributes );
		} else if ( isCollapsed( value ) && ! isActive ) { // insert link
			const toInsert = applyFormat( create( { text: linkText } ), format, 0, linkText.length );
			const newAttributes = insert( value, toInsert );
			onChange( { ...newAttributes, needsSelectionUpdate: true } );
		} else if ( text !== getTextContent( slice( value ) ) ) { // edit text in selected link
			const toInsert = applyFormat( create( { text } ), format, 0, text.length );
			const newAttributes = insert( value, toInsert, value.start, value.end );
			onChange( { ...newAttributes, needsSelectionUpdate: true } );
		} else { // transform selected text into link
			const newAttributes = applyFormat( value, format );
			onChange( { ...newAttributes, needsSelectionUpdate: true } );
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

	removeLink() {
		const { onBlockAttributesChange, onRemove, onClose, selectedBlockClientId } = this.props;

		onBlockAttributesChange( selectedBlockClientId, { url: '', rel: '', linkTarget: undefined } );
		onRemove();
		onClose();
	}

	onDismiss() {
		if ( this.state.inputValue === '' ) {
			this.removeLink();
		} else {
			this.submitLink();
		}
	}

	render() {
		const { isVisible, isSelectedButtonBlock } = this.props;
		const { text, inputValue, linkRel, opensInNewWindow } = this.state;

		return (
			<BottomSheet
				isVisible={ isVisible }
				onClose={ this.onDismiss }
				hideHeader
			>
				{ /* eslint-disable jsx-a11y/no-autofocus */
					<BottomSheet.Cell
						icon={ 'admin-links' }
						label={ isSelectedButtonBlock ? __( 'Button URL' ) : __( 'URL' ) }
						value={ inputValue }
						placeholder={ __( 'Add URL' ) }
						autoCapitalize="none"
						autoCorrect={ false }
						keyboardType="url"
						onChangeValue={ this.onChangeInputValue }
						autoFocus={ Platform.OS === 'ios' }
					/>
				/* eslint-enable jsx-a11y/no-autofocus */ }
				{ isSelectedButtonBlock && <BottomSheet.Cell
					icon={ LinkRelIcon }
					label={ __( 'Add Rel' ) }
					value={ linkRel }
					placeholder={ __( 'None' ) }
					autoCapitalize="none"
					onChangeValue={ this.onSetLinkRel }
				/> }
				{ ! isSelectedButtonBlock && <BottomSheet.Cell
					icon={ 'editor-textcolor' }
					label={ __( 'Link text' ) }
					value={ text }
					placeholder={ __( 'Add link text' ) }
					onChangeValue={ this.onChangeText }
				/> }
				<BottomSheet.SwitchCell
					icon={ 'external' }
					label={ __( 'Open in new tab' ) }
					value={ opensInNewWindow }
					onValueChange={ this.onChangeOpensInNewWindow }
					separatorType={ 'fullWidth' }
				/>
				<BottomSheet.Cell
					label={ __( 'Remove link' ) }
					labelStyle={ styles.clearLinkButton }
					separatorType={ 'none' }
					onPress={ this.removeLink }
				/>
			</BottomSheet>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlock } = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlock = selectedBlockClientId && getBlock( selectedBlockClientId );
		const selectedBlockAttributes = ( selectedBlock && selectedBlock.attributes ) || {};
		const isSelectedButtonBlock = selectedBlock && selectedBlock.name === 'core/button';

		return {
			selectedBlockClientId,
			selectedBlockAttributes,
			isSelectedButtonBlock,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { updateBlockAttributes } = dispatch( 'core/block-editor' );

		return {
			onBlockAttributesChange: ( selectedBlockClientId, attributes ) => {
				updateBlockAttributes( selectedBlockClientId, attributes );
			},
		};
	} ),
	withSpokenMessages,
] )( ModalLinkUI );
