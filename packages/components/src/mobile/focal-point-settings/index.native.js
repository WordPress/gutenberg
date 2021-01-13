/**
 * External dependencies
 */
import React from 'react';
import { SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { isFinite } from 'lodash';

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
import styles from './styles.scss';

const FocalPointSettingsMemo = React.memo(
	( {
		focalPoint,
		onFocalPointChange,
		onHandleClosingBottomSheet,
		setIsFullScreen,
		shouldEnableBottomSheetScroll,
		url,
	} ) => {
		const navigation = useNavigation();

		/**
		 * Ensure the full-screen bottom sheet is disabled. `useFocusEffect` is not
		 * triggered when dismissing the bottom sheet via swipe or tapping the
		 * overlay.
		 */
		useEffect( () => {
			onHandleClosingBottomSheet( () => {
				setIsFullScreen( false );
			} );
		}, [] );

		function onButtonPress( action ) {
			navigation.goBack();
			if ( action === 'apply' ) {
				onFocalPointChange( draftFocalPoint );
			}
		}

		const [ draftFocalPoint, setDraftFocalPoint ] = useState( focalPoint );
		function setPosition( { x, y } ) {
			setDraftFocalPoint( ( prevState ) => ( {
				...prevState,
				...( isFinite( x ) ? { x } : {} ),
				...( isFinite( y ) ? { y } : {} ),
			} ) );
		}

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
					onChange={ setPosition }
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
		setIsFullScreen,
		shouldEnableBottomSheetScroll,
	} = useContext( BottomSheetContext );

	return (
		<FocalPointSettingsMemo
			onHandleClosingBottomSheet={ onHandleClosingBottomSheet }
			setIsFullScreen={ setIsFullScreen }
			shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
			{ ...props }
			{ ...route.params }
		/>
	);
}

export default FocalPointSettings;
