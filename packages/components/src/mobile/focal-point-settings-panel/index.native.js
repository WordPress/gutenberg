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
import Header from '../bottom-sheet/header';
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
				<Header>
					<Header.CancelButton
						onPress={ () => onButtonPress( 'cancel' ) }
					/>
					<Header.Title>{ __( 'Edit focal point' ) }</Header.Title>
					<Header.ApplyButton
						onPress={ () => onButtonPress( 'apply' ) }
					/>
				</Header>
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
