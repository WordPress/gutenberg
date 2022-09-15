/**
 * External dependencies
 */
import { Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';

import { LinkPicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import linkSettingsScreens from './screens';

const LinkPickerScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const navigateToLinkTimeoutRef = useRef( null );
	const navigateBackTimeoutRef = useRef( null );

	const onLinkPicked = ( { url, title } ) => {
		Keyboard.dismiss();
		navigateToLinkTimeoutRef.current = setTimeout( () => {
			navigation.navigate( linkSettingsScreens.settings, {
				inputValue: url,
				text: title,
			} );
		}, 100 );
	};

	const onCancel = () => {
		Keyboard.dismiss();
		navigateBackTimeoutRef.current = setTimeout( () => {
			navigation.goBack();
		}, 100 );
	};

	useEffect( () => {
		return () => {
			clearTimeout( navigateToLinkTimeoutRef.current );
			clearTimeout( navigateBackTimeoutRef.current );
		};
	}, [] );

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
