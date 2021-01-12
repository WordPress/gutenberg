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
import { useContext, useState } from '@wordpress/element';
import { BottomSheetContext, FocalPointPicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import NavigationHeader from '../bottom-sheet/navigation-header';
import styles from './styles.scss';

const FocalPointSettingsMemo = React.memo(
	( {
		focalPoint,
		onFocalPointChange,
		shouldEnableBottomSheetScroll,
		url,
	} ) => {
		const navigation = useNavigation();

		function onButtonPress( action ) {
			navigation.goBack();
			if ( action === 'apply' ) {
				onFocalPointChange( draftFocalPoint );
			}
		}
		const [ draftFocalPoint, setDraftFocalPoint ] = useState( focalPoint );

		return (
			<SafeAreaView style={ styles.safearea }>
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
	const { shouldEnableBottomSheetScroll } = useContext( BottomSheetContext );

	return (
		<FocalPointSettingsMemo
			shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
			{ ...props }
			{ ...route.params }
		/>
	);
}

export default FocalPointSettings;
