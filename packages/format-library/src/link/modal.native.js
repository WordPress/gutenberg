/**
 * External dependencies
 */
import React from 'react';
import {
	NavigationContainer,
	DefaultTheme,
	useNavigation,
	useRoute,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, useState, useContext, useEffect } from '@wordpress/element';
import { prependHTTP } from '@wordpress/url';
import {
	BottomSheet,
	BottomSheetContext,
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

const LinkPickerScreen = () => {
	const navigation = useNavigation();
	const params = useRoute()?.params;
	const bottomSheetContext = useContext( BottomSheetContext );
	const goBack = () => {
		bottomSheetContext.shouldDisableBottomSheetMaxHeight( true );
		navigation.goBack();
	};
	const onLinkPicked = ( ...args ) => {
		params.onLinkPicked( ...args );
		goBack();
	};

	return (
		<BottomSheet.NavigationScreen fullHeight>
			<LinkPicker
				value={ params.inputValue }
				onLinkPicked={ onLinkPicked }
				onCancel={ goBack }
			/>
		</BottomSheet.NavigationScreen>
	);
};

const MainLinkSettingsScreen = () => {
	const navigation = useNavigation();
	const params = useRoute()?.params;
	const [ inputValue, setInputValue ] = useState( '' );
	const [ text, setText ] = useState( '' );
	const [ opensInNewWindow, setopensInNewWindow ] = useState( false );
	const bottomSheetContext = useContext( BottomSheetContext );

	useEffect( () => {
		bottomSheetContext.onCloseBottomSheet( onDismiss );
	}, [ inputValue ] );

	const removeLink = () => {
		if ( params.onRemove && params.onClose ) {
			params.onRemove();
			params.onClose();
		}
	};

	const onLinkPicked = ( { url, title } ) => {
		if ( ! text ) {
			setInputValue( url );
			setText( title );
		} else {
			setInputValue( url );
		}
	};

	const onDismiss = () => {
		if ( inputValue === '' ) {
			removeLink();
		} else {
			submitLink();
		}
	};

	const submitLink = () => {
		const { isActive, onChange, speak, value, onClose } = params;
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

		onClose();
	};

	const navigateToPicker = () => {
		navigation.navigate( 'LinkPicker', { onLinkPicked, inputValue } );
	};

	return (
		<BottomSheet.NavigationScreen>
			<>
				<LinkCell value={ inputValue } onPress={ navigateToPicker } />
				<BottomSheet.Cell
					icon={ textColor }
					label={ __( 'Link text' ) }
					value={ text }
					placeholder={ __( 'Add link text' ) }
					onChangeValue={ setText }
					onSubmit={ onDismiss }
				/>
				<BottomSheet.SwitchCell
					icon={ external }
					label={ __( 'Open in new tab' ) }
					value={ opensInNewWindow }
					onValueChange={ setopensInNewWindow }
					separatorType={ 'fullWidth' }
				/>
				<BottomSheet.Cell
					label={ __( 'Remove link' ) }
					labelStyle={ styles.clearLinkButton }
					separatorType={ 'none' }
					onPress={ removeLink }
				/>
			</>
		</BottomSheet.NavigationScreen>
	);
};

const LinkCell = ( { value, onPress } ) => {
	return <BottomSheet.LinkCell value={ value } onPress={ onPress } />;
};

class ModalLinkUI extends Component {
	render() {
		const { isVisible, getStylesFromColorScheme } = this.props;

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
								component={ MainLinkSettingsScreen }
								initialParams={ this.props }
							/>
							<Stack.Screen
								options={ BottomSheet.NavigationScreen.options }
								name="LinkPicker"
								component={ LinkPickerScreen }
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
