/**
 * External dependencies
 */
import React from 'react';
import {
	NavigationContainer,
	DefaultTheme,
	useNavigation,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { prependHTTP } from '@wordpress/url';
import {
	BottomSheet,
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
import { compose, withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';

import styles from './modal.scss';
const Stack = createStackNavigator();

const LinkPickerScreen = ( { inputValue, onLinkPicked: pickLink } ) => {
	const navigation = useNavigation();
	const goBack = () => navigation.navigate( 'LinkSettings' );
	const onLinkPicked = ( ...args ) => {
		pickLink( ...args );
		goBack();
	};

	return (
		<BottomSheet.NavigationScreen>
			<LinkPicker
				value={ inputValue }
				onLinkPicked={ onLinkPicked }
				onCancel={ goBack }
			/>
		</BottomSheet.NavigationScreen>
	);
};

const LinkCell = ( { value } ) => {
	const navigation = useNavigation();

	return (
		<BottomSheet.LinkCell
			value={ value }
			onPress={ () => {
				navigation.navigate( 'LinkPicker' );
			} }
		/>
	);
};

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
		this.renderMainScreen = this.renderMainScreen.bind( this );
		this.renderPickerScreen = this.renderPickerScreen.bind( this );
		this.onLinkPicked = this.onLinkPicked.bind( this );

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

	renderMainScreen() {
		const { inputValue, text } = this.state;

		return (
			<BottomSheet.NavigationScreen>
				<>
					<LinkCell value={ inputValue } />
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
			</BottomSheet.NavigationScreen>
		);
	}

	onLinkPicked( { url, title } ) {
		if ( ! this.state.text ) {
			this.setState( { inputValue: url, text: title } );
		} else {
			this.setState( { inputValue: url } );
		}
	}

	renderPickerScreen() {
		const { inputValue } = this.state;

		return (
			<LinkPickerScreen
				inputValue={ inputValue }
				onLinkPicked={ this.onLinkPicked }
			/>
		);
	}
	render() {
		const { isVisible, getStylesFromColorScheme } = this.props;
		const { isFullScreen } = this.state;

		const backgroundStyle = getStylesFromColorScheme(
			styles.background,
			styles.backgroundDark
		);

		const MyTheme = {
			...DefaultTheme,
			colors: {
				...DefaultTheme.colors,
				background: backgroundStyle.backgroundColor,
			},
		};

		return (
			<BottomSheet
				isVisible={ isVisible }
				onClose={ this.onDismiss }
				adjustToContentHeight
				hideHeader
				isChildrenScrollable
			>
				<BottomSheet.NavigationContainer animate>
					<NavigationContainer theme={ MyTheme }>
						<Stack.Navigator
							screenOptions={ {
								headerShown: false,
								gestureEnabled: false,
							} }
						>
							<Stack.Screen
								options={ BottomSheet.NavigationScreen.options }
								name="LinkSettings"
								component={ this.renderMainScreen }
							/>
							<Stack.Screen
								options={ BottomSheet.NavigationScreen.options }
								name="LinkPicker"
								component={ this.renderPickerScreen }
							/>
						</Stack.Navigator>
					</NavigationContainer>
				</BottomSheet.NavigationContainer>
			</BottomSheet>
		);
	}
}

export default compose( [ withSpokenMessages, withPreferredColorScheme ] )(
	ModalLinkUI
);
