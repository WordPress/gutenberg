/**
 * External dependencies
 */
import React from 'react';
import { Platform, Keyboard, InteractionManager } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { delay } from 'lodash';
/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';

import { LinkPicker, BottomSheetContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import linkSettingsScreens from './screens';

const LinkPickerScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { setIsChildrenScrollable } = useContext( BottomSheetContext );
	const onLinkPicked = ( { url, title } ) => {
		if ( Platform.OS === 'android' ) {
			Keyboard.dismiss();
			delay( () => {
				navigation.navigate( linkSettingsScreens.settings, {
					inputValue: url,
					text: title,
				} );
			}, 100 );
			InteractionManager.runAfterInteractions( () => {
				setIsChildrenScrollable( false );
			} );
			return;
		}
		navigation.navigate( linkSettingsScreens.settings, {
			inputValue: url,
			text: title,
		} );
		InteractionManager.runAfterInteractions( () => {
			setIsChildrenScrollable( false );
		} );
	};

	const onCancel = () => {
		if ( Platform.OS === 'android' ) {
			Keyboard.dismiss();
			delay( () => {
				navigation.goBack();
			}, 100 );
			InteractionManager.runAfterInteractions( () => {
				setIsChildrenScrollable( false );
			} );
			return;
		}
		InteractionManager.runAfterInteractions( () => {
			setIsChildrenScrollable( false );
		} );
		navigation.goBack();
	};

	const { inputValue } = route.params;
	return useMemo( () => {
		return (
			<LinkPicker
				value={ inputValue }
				onLinkPicked={ onLinkPicked }
				onCancel={ onCancel }
			/>
		);
	}, [ inputValue ] );
};

export default LinkPickerScreen;
