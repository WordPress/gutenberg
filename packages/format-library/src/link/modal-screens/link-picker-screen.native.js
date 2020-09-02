/**
 * External dependencies
 */
import React from 'react';
import { Keyboard, InteractionManager, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

import { LinkPicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import linkSettingsScreens from './screens';

const LinkPickerScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const onLinkPicked = ( { url, title } ) => {
		if ( Platform.OS === 'android' ) {
			Keyboard.dismiss();
			InteractionManager.runAfterInteractions( () => {
				navigation.navigate( linkSettingsScreens.settings, {
					inputValue: url,
					text: title,
				} );
			} );
		} else {
			navigation.navigate( linkSettingsScreens.settings, {
				inputValue: url,
				text: title,
			} );
		}
	};

	const onCancel = () => {
		if ( Platform.OS === 'android' ) {
			Keyboard.dismiss();
			InteractionManager.runAfterInteractions( () => {
				navigation.goBack();
			} );
		} else {
			navigation.goBack();
		}
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
