/**
 * External dependencies
 */
import React from 'react';
import { Platform, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useContext } from '@wordpress/element';
import { BottomSheetContext, FocalPointPicker } from '@wordpress/components';
import { Icon, check, close } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
// TODO(David): Duplicate styles or identify abstraction
import styles from '../../color-picker/style.scss';

function FocalPointSettings() {
	const navigation = useNavigation();
	const isIOS = Platform.OS === 'ios';
	const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };
	const {
		onHandleClosingBottomSheet,
		shouldEnableBottomSheetMaxHeight,
	} = useContext( BottomSheetContext );
	useEffect( () => {
		shouldEnableBottomSheetMaxHeight( true );
		onHandleClosingBottomSheet( null );
	}, [] );

	const applyButtonStyle = usePreferredColorSchemeStyle(
		styles.applyButton,
		styles.applyButtonDark
	);
	const cancelButtonStyle = usePreferredColorSchemeStyle(
		styles.cancelButton,
		styles.cancelButtonDark
	);
	const footerStyle = usePreferredColorSchemeStyle(
		styles.footer,
		styles.footerDark
	);

	function onButtonPress( action ) {
		navigation.goBack();
		onHandleClosingBottomSheet( null );
		shouldEnableBottomSheetMaxHeight( true );
		// TODO(David): Persist focal point changes
		if ( action === 'apply' ) {
			console.log( '> APPLY: Focal Point' );
		} else {
			console.log( '> CANCEL: Focal Point' );
		}
	}

	return (
		<>
			<FocalPointPicker
			// url={ url }
			// value={ focalPoint }
			// onChange={ ( newFocalPoint ) =>
			// 	setAttributes( {
			// 		focalPoint: newFocalPoint,
			// 	} )
			// }
			/>
			<View style={ footerStyle }>
				<TouchableWithoutFeedback
					onPress={ () => onButtonPress( 'cancel' ) }
					hitSlop={ hitSlop }
				>
					<View>
						{ isIOS ? (
							<Text style={ cancelButtonStyle }>
								{ __( 'Cancel' ) }
							</Text>
						) : (
							<Icon
								icon={ close }
								size={ 24 }
								style={ cancelButtonStyle }
							/>
						) }
					</View>
				</TouchableWithoutFeedback>
				<TouchableWithoutFeedback
					onPress={ () => onButtonPress( 'apply' ) }
					hitSlop={ hitSlop }
				>
					<View>
						{ isIOS ? (
							<Text style={ applyButtonStyle }>
								{ __( 'Apply' ) }
							</Text>
						) : (
							<Icon
								icon={ check }
								size={ 24 }
								style={ applyButtonStyle }
							/>
						) }
					</View>
				</TouchableWithoutFeedback>
			</View>
		</>
	);
}

export default FocalPointSettings;
