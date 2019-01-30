/**
 * External dependencies
 */
import React from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import Modal from 'react-native-modal';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { URLInput } from '@wordpress/editor';
import { prependHTTP } from '@wordpress/url';

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
import styles from './styles.scss';
import Button from './button'

class BottomSheet extends Component {
	constructor( props ) {
		super( ...arguments );
		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.state = {
			safeAreaBottomInset: 0,
		};

		SafeArea.getSafeAreaInsetsForRootView().then( this.onSafeAreaInsetsUpdate );
	}

	componentDidMount() {
		SafeArea.addEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
	}

	componentWillUnmount() {
		SafeArea.removeEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
	}

	onLeftButtonPressed() {

	}

	onRightButtonPressed() {

	}

	headerButton(text, color, handler) {
		return(
			<Button onClick={ handler }>
				<Text style={ { ...styles.buttonText, color: color } }>
					{ text }
				</Text>
			</Button>
		)
	}

	onSafeAreaInsetsUpdate( result ) {
		const { safeAreaInsets } = result;
		if ( this.state.safeAreaBottomInset !== safeAreaInsets.bottom ) {
			this.setState( { safeAreaBottomInset: safeAreaInsets.bottom } );
		}
	}

	render() {
		const { isVisible } = this.props;
		const { hideLeftButton, hideRightButton } = this.props;

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
					<View style={ styles.dragIndicator } />
						<View style={ styles.head }>
							{ hideLeftButton || this.headerButton(__( "Remove" ), "red", this.onLeftButtonPressed) }
							<Text style={ styles.title }>
								{ this.props.title }
							</Text>
							{ hideRightButton || this.headerButton(__("Done"), "#0087be", this.onRightButtonPressed) }
						</View>
						<View style={ styles.separator } />
						{ this.props.children }
						<View style={ { flexGrow: 1 } }></View>
						<View style={ { height: this.state.safeAreaBottomInset } } />
				</View>
			</Modal>
		);
	}
}

export default BottomSheet;

export function TitleValueCell(props) {
	const {
		title,
		value,
		onPress,
	} = props;

	return (
		<Button style={{ flexDirection: 'row', alignItems: 'center'}} onPress={ onPress }>
			<Text style={ styles.cellLabel }>
				{ title }
			</Text>
			<Text style={ styles.cellValue }>
				{ value }
			</Text>
		</Button>
	)
}
