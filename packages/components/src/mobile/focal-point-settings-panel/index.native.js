/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { memo, useContext, useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NavBar from '../bottom-sheet/nav-bar';
import styles from './styles.scss';
import { BottomSheetContext } from '../bottom-sheet/bottom-sheet-context';
import FocalPointPicker from '../../focal-point-picker';

const FocalPointSettingsPanelMemo = memo(
	( { focalPoint, shouldEnableBottomSheetScroll, url } ) => {
		const navigation = useNavigation();

		function onButtonPress( action ) {
			if ( action === 'apply' ) {
				// TODO: To better align with existing code, the below 'Settings' string
				// literal should be replaced with a constant. However, importing the
				// current constant creates a circular dependency.
				// https://github.com/WordPress/gutenberg/blob/12518a05af35aa504f7c8b086cb6f255cf094f25/packages/block-editor/src/components/block-settings/container.native.js#L23
				navigation.navigate( 'Settings', {
					draftFocalPoint,
				} );
				return;
			}

			navigation.goBack();
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
				<NavBar>
					<NavBar.DismissButton
						onPress={ () => onButtonPress( 'cancel' ) }
					/>
					<NavBar.Heading>
						{ __( 'Edit focal point' ) }
					</NavBar.Heading>
					<NavBar.ApplyButton
						onPress={ () => onButtonPress( 'apply' ) }
					/>
				</NavBar>
				<FocalPointPicker
					focalPoint={ draftFocalPoint }
					onChange={ useCallback( setPosition, [] ) }
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
