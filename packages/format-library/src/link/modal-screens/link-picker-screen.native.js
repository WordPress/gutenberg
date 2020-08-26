/**
 * External dependencies
 */
import React from 'react';
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
		navigation.navigate( linkSettingsScreens.settings, {
			inputValue: url,
			text: title,
		} );
	};

	const { inputValue } = route.params;
	return useMemo( () => {
		return (
			<LinkPicker
				value={ inputValue }
				onLinkPicked={ onLinkPicked }
				onCancel={ navigation.goBack }
			/>
		);
	}, [ inputValue ] );
};

export default LinkPickerScreen;
