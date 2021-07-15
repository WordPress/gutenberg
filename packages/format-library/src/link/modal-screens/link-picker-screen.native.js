/**
 * External dependencies
 */
import { Platform, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { delay } from 'lodash';
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
			delay( () => {
				navigation.navigate( linkSettingsScreens.settings, {
					inputValue: url,
					text: title,
				} );
			}, 100 );
			return;
		}
		navigation.navigate( linkSettingsScreens.settings, {
			inputValue: url,
			text: title,
		} );
	};

	const onCancel = () => {
		if ( Platform.OS === 'android' ) {
			Keyboard.dismiss();
			delay( () => {
				navigation.goBack();
			}, 100 );
			return;
		}
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
