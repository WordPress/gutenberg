/**
 * External dependencies
 */
import React from 'react';
import { SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useContext, useState } from '@wordpress/element';
import { BottomSheetContext, FocalPointPicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import NavigationHeader from '../bottom-sheet/navigation-header';

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
			shouldEnableBottomSheetMaxHeight( false );
			onHandleClosingBottomSheet( null );
		}, [] );
		const navigation = useNavigation();

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
			<SafeAreaView style={ { height: '100%' } }>
				<NavigationHeader
					screen={ __( 'Edit focal point' ) }
					leftButtonOnPress={ () => onButtonPress( 'cancel' ) }
					applyButtonOnPress={ () => onButtonPress( 'apply' ) }
					isFullscreen
				/>
				<FocalPointPicker
					focalPoint={ draftFocalPoint }
					onChange={ setDraftFocalPoint }
					shouldEnableBottomSheetScroll={
						shouldEnableBottomSheetScroll
					}
					url={ url }
				/>
			</SafeAreaView>
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
