/**
 * External dependencies
 */
import React from 'react';
import {
	useNavigation,
	useRoute,
	useFocusEffect,
} from '@react-navigation/native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
	useState,
	useContext,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { prependHTTP } from '@wordpress/url';

import {
	BottomSheet,
	LinkPicker,
	withSpokenMessages,
	BottomSheetContext,
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

const linkSettingsScreens = {
	settings: 'linkSettings',
	picker: 'linkPicker',
};

class ModalLinkUI extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			isChildrenScrollable: false,
		};
	}

	render() {
		const { isVisible, ...restProps } = this.props;
		const {
			activeAttributes: { url },
		} = this.props;

		return (
			<BottomSheet
				isVisible={ isVisible }
				hideHeader
				isChildrenScrollable={ this.state.isChildrenScrollable }
			>
				<BottomSheet.NavigationContainer animate main>
					<BottomSheet.NavigationScreen
						name={ linkSettingsScreens.settings }
						initialParams={ { inputValue: url || '' } }
					>
						<LinkSettingsScreen
							{ ...restProps }
							onFocus={ () => {
								this.setState( {
									isChildrenScrollable: false,
								} );
							} }
						/>
					</BottomSheet.NavigationScreen>
					<BottomSheet.NavigationScreen
						name={ linkSettingsScreens.picker }
						fullScreen
					>
						<LinkPickerScreen
							onFocus={ () => {
								this.setState( { isChildrenScrollable: true } );
							} }
						/>
					</BottomSheet.NavigationScreen>
				</BottomSheet.NavigationContainer>
			</BottomSheet>
		);
	}
}

export default withSpokenMessages( ModalLinkUI );

const LinkSettingsScreen = ( {
	onRemove,
	onClose,
	onChange,
	speak,
	value,
	isActive,
	activeAttributes,
	onFocus,
} ) => {
	const [ text, setText ] = useState( getTextContent( slice( value ) ) );
	const [ opensInNewWindow, setOpensInNewWindows ] = useState(
		activeAttributes.target === '_blank'
	);

	const {
		shouldEnableBottomSheetMaxHeight,
		onHandleClosingBottomSheet,
	} = useContext( BottomSheetContext );

	const navigation = useNavigation();
	const route = useRoute();
	const { inputValue } = route.params || {};
	const onLinkCellPressed = () => {
		shouldEnableBottomSheetMaxHeight( false );
		navigation.navigate( linkSettingsScreens.picker, { inputValue } );
	};
	useEffect( () => {
		onHandleClosingBottomSheet( () => {
			submit();
		} );
	}, [ inputValue, opensInNewWindow, text ] );

	const submitLink = () => {
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

	const removeLink = () => {
		onRemove();
		onClose();
	};

	const submit = () => {
		if ( inputValue === '' ) {
			removeLink();
		} else {
			submitLink();
		}
	};

	useFocusEffect(
		useCallback( () => {
			const { params = {} } = route;
			onFocus();
			if ( ! text && params.text ) {
				setText( params.text );
			}
			return () => {};
		}, [ route.params.text, text, onFocus ] )
	);

	return (
		<>
			<BottomSheet.LinkCell
				value={ inputValue }
				onPress={ onLinkCellPressed }
			/>
			<BottomSheet.Cell
				icon={ textColor }
				label={ __( 'Link text' ) }
				value={ text }
				placeholder={ __( 'Add link text' ) }
				onChangeValue={ setText }
				onSubmit={ submit }
			/>
			<BottomSheet.SwitchCell
				icon={ external }
				label={ __( 'Open in new tab' ) }
				value={ opensInNewWindow }
				onValueChange={ setOpensInNewWindows }
				separatorType={ 'fullWidth' }
			/>
			<BottomSheet.Cell
				label={ __( 'Remove link' ) }
				labelStyle={ styles.clearLinkButton }
				separatorType={ 'none' }
				onPress={ removeLink }
			/>
		</>
	);
};

const LinkPickerScreen = ( { onFocus } ) => {
	const navigation = useNavigation();
	const route = useRoute();
	const onLinkPicked = ( { url, title } ) => {
		navigation.navigate( linkSettingsScreens.settings, {
			inputValue: url,
			text: title,
		} );
	};
	useFocusEffect(
		useCallback( () => {
			onFocus();
			return () => {};
		}, [ onFocus ] )
	);
	const { inputValue } = route.params;
	return (
		<LinkPicker
			value={ inputValue }
			onLinkPicked={ onLinkPicked }
			onCancel={ navigation.goBack }
		/>
	);
};
