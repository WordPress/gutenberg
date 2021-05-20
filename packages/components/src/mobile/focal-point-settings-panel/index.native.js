/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { memo, useContext, useState } from '@wordpress/element';
import { BottomSheetContext, FocalPointPicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import NavigationHeader from '../bottom-sheet/navigation-header';
import styles from './styles.scss';

const FocalPointSettingsPanelMemo = memo(
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
		function setPosition( coordinates ) {
			setDraftFocalPoint( ( prevState ) => ( {
				...prevState,
				...coordinates,
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

function FocalPointSettingsPanel( props ) {
	const route = useRoute();
	const { shouldEnableBottomSheetScroll } = useContext( BottomSheetContext );

	return (
		<FocalPointSettingsPanelMemo
			shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
			{ ...props }
			{ ...route.params }
		/>
	);
}

export default FocalPointSettingsPanel;
