/**
 * External dependencies
 */
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useContext, useEffect, useMemo } from '@wordpress/element';
import { prependHTTP } from '@wordpress/url';
import { BottomSheet, BottomSheetContext } from '@wordpress/components';
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
import { createLinkFormat, isValidHref } from '../utils';
import linkSettingsScreens from './screens';

import styles from '../modal.scss';

const LinkSettingsScreen = ( {
	onRemove,
	onClose,
	onChange,
	speak,
	value,
	isActive,
	activeAttributes,
	isVisible,
} ) => {
	const [ text, setText ] = useState( getTextContent( slice( value ) ) );
	const [ opensInNewWindow, setOpensInNewWindows ] = useState(
		activeAttributes.target === '_blank'
	);
	const [ linkValues, setLinkValues ] = useState( {
		isActiveLink: isActive,
		isRemovingLink: false,
	} );

	const {
		shouldEnableBottomSheetMaxHeight,
		onHandleClosingBottomSheet,
		listProps,
	} = useContext( BottomSheetContext );

	const navigation = useNavigation();
	const route = useRoute();
	const { inputValue = activeAttributes.url || '' } = route.params || {};
	const onLinkCellPressed = () => {
		shouldEnableBottomSheetMaxHeight( false );
		navigation.navigate( linkSettingsScreens.picker, { inputValue } );
	};
	useEffect( () => {
		onHandleClosingBottomSheet( () => {
			submit( inputValue, { skipStateUpdates: true } );
		} );
	}, [ inputValue, opensInNewWindow, text ] );

	useEffect( () => {
		const { isActiveLink, isRemovingLink } = linkValues;
		if ( !! inputValue && ! isActiveLink && isVisible ) {
			submitLink( { shouldCloseBottomSheet: false } );
		} else if (
			( ( inputValue === '' && isActiveLink ) || isRemovingLink ) &&
			isVisible
		) {
			removeLink( { shouldCloseBottomSheet: false } );
		}
	}, [
		inputValue,
		isVisible,
		linkValues.isActiveLink,
		linkValues.isRemovingLink,
	] );

	const clearFormat = ( { skipStateUpdates = false } = {} ) => {
		onChange( { ...value, activeFormats: [] } );
		if ( ! skipStateUpdates ) {
			setLinkValues( { isActiveLink: false, isRemovingLink: true } );
		}
	};

	const submitLink = ( {
		shouldCloseBottomSheet = true,
		skipStateUpdates = false,
	} = {} ) => {
		const url = prependHTTP( inputValue );
		const linkText = text || inputValue;
		const format = createLinkFormat( {
			url,
			opensInNewWindow,
			text: linkText,
		} );
		let newAttributes;
		if ( isCollapsed( value ) && ! isActive ) {
			// Insert link.
			const toInsert = applyFormat(
				create( { text: linkText } ),
				format,
				0,
				linkText.length
			);
			newAttributes = insert( value, toInsert );
		} else if ( text !== getTextContent( slice( value ) ) ) {
			// Edit text in selected link.
			const toInsert = applyFormat(
				create( { text } ),
				format,
				0,
				text.length
			);
			newAttributes = insert( value, toInsert, value.start, value.end );
		} else {
			// Transform selected text into link.
			newAttributes = applyFormat( value, format );
		}
		// Move selection to end of link.
		const textLength = newAttributes.text.length;
		// check for zero width spaces
		if ( newAttributes.end > textLength ) {
			newAttributes.start = textLength;
			newAttributes.end = textLength;
		} else {
			newAttributes.start = newAttributes.end;
		}
		newAttributes.activeFormats = [];
		onChange( { ...newAttributes, needsSelectionUpdate: true } );
		if ( ! skipStateUpdates ) {
			setLinkValues( { isActiveLink: true, isRemovingLink: false } );
		}

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

		if ( shouldCloseBottomSheet ) {
			onClose();
		}
	};

	const removeLink = ( {
		shouldCloseBottomSheet = true,
		skipStateUpdates = false,
	} = {} ) => {
		clearFormat( { skipStateUpdates } );
		onRemove();
		if ( shouldCloseBottomSheet ) {
			onClose();
		}
	};

	const submit = ( submitValue, { skipStateUpdates = false } = {} ) => {
		if ( submitValue === '' ) {
			removeLink( { skipStateUpdates } );
		} else {
			submitLink( { skipStateUpdates } );
		}
	};

	useEffect( () => {
		const unsubscribe = navigation.addListener( 'focus', () => {
			const { params = {} } = route;
			if ( ! text && params.text ) {
				setText( params.text );
			}
		} );
		return unsubscribe;
	}, [ navigation, route.params?.text, text ] );

	return useMemo( () => {
		const shouldShowLinkOptions = !! inputValue;

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
					separatorType={ shouldShowLinkOptions ? undefined : 'none' }
				/>
				{ shouldShowLinkOptions && (
					<>
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
				) }
			</>
		);
	}, [ inputValue, text, opensInNewWindow, listProps.safeAreaBottomInset ] );
};

export default LinkSettingsScreen;
