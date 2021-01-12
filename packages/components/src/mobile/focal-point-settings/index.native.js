/**
 * External dependencies
 */
import React from 'react';
import { Platform, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useContext, useState } from '@wordpress/element';
import { BottomSheetContext, FocalPointPicker } from '@wordpress/components';
import { Icon, check, close } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
// TODO(David): Duplicate styles or identify abstraction
import styles from '../../color-picker/style.scss';

const FocalPointSettingsMemo = React.memo(
	( {
		focalPoint,
		onFocalPointChange,
		onHandleClosingBottomSheet,
		shouldEnableBottomSheetMaxHeight,
		shouldEnableBottomSheetScroll,
		url,
	} ) => {
		useEffect( () => {
			shouldEnableBottomSheetMaxHeight( true );
			onHandleClosingBottomSheet( null );
		}, [] );
		const navigation = useNavigation();
		const isIOS = Platform.OS === 'ios';
		const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };

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
			if ( action === 'apply' ) {
				onFocalPointChange( draftFocalPoint );
			}
		}
		const [ draftFocalPoint, setDraftFocalPoint ] = useState( focalPoint );

		return (
			<>
				<FocalPointPicker
					focalPoint={ draftFocalPoint }
					onChange={ setDraftFocalPoint }
					shouldEnableBottomSheetScroll={
						shouldEnableBottomSheetScroll
					}
					url={ url }
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
);

function FocalPointSettings( props ) {
	const route = useRoute();
	const {
		onHandleClosingBottomSheet,
		shouldEnableBottomSheetScroll,
		shouldEnableBottomSheetMaxHeight,
	} = useContext( BottomSheetContext );

	return (
		<FocalPointSettingsMemo
			onHandleClosingBottomSheet={ onHandleClosingBottomSheet }
			shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
			shouldEnableBottomSheetMaxHeight={
				shouldEnableBottomSheetMaxHeight
			}
			{ ...props }
			{ ...route.params }
		/>
	);
}

export default FocalPointSettings;
