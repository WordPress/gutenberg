/**
 * External dependencies
 */
import { SafeAreaView, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { memo, useContext, useState } from '@wordpress/element';
import {
	BottomSheet,
	BottomSheetContext,
	FocalPointPicker,
	Icon,
} from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import NavigationHeader from '../bottom-sheet/navigation-header';
import styles from './styles.scss';

const FocalPointSettingsMemo = memo(
	( {
		disabled,
		focalPoint,
		onFocalPointChange,
		shouldEnableBottomSheetScroll,
		url,
	} ) => {
		const navigation = useNavigation();
		const [ showSubSheet, setShowSubSheet ] = useState( false );

		function openSubSheet() {
			navigation.navigate( BottomSheet.SubSheet.screenName, {
				focalPoint,
				onFocalPointChange,
				url,
			} );
			setShowSubSheet( true );
		}

		function onButtonPress( action ) {
			navigation.goBack();
			if ( action === 'apply' ) {
				onFocalPointChange( draftFocalPoint );
			}
			setShowSubSheet( false );
		}

		const [ draftFocalPoint, setDraftFocalPoint ] = useState( focalPoint );
		function setPosition( coordinates ) {
			setDraftFocalPoint( ( prevState ) => ( {
				...prevState,
				...coordinates,
			} ) );
		}

		return (
			<BottomSheet.SubSheet
				isFullScreen={ true }
				navigationButton={
					<BottomSheet.Cell
						customActionButton
						disabled={ disabled }
						labelStyle={ disabled && styles.dimmedActionButton }
						leftAlign
						label={ __( 'Edit focal point' ) }
						onPress={ openSubSheet }
					>
						{ /*
						 * Wrapper View element used around Icon as workaround for SVG opacity
						 * issue: https://git.io/JtuXD
						 */ }
						<View style={ disabled && styles.dimmedActionButton }>
							<Icon icon={ chevronRight } />
						</View>
					</BottomSheet.Cell>
				}
				showSheet={ showSubSheet }
			>
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
			</BottomSheet.SubSheet>
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
