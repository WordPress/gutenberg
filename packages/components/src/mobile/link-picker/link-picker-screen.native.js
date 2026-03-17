/**
 * External dependencies
 */
import { Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { LinkPicker } from './';

const LinkPickerScreen = ( { returnScreenName } ) => {
	const navigation = useNavigation();
	const route = useRoute();
	const navigateToLinkTimeoutRef = useRef( null );
	const navigateBackTimeoutRef = useRef( null );

	const onLinkPicked = ( { url, title } ) => {
		Keyboard.dismiss();
		navigateToLinkTimeoutRef.current = setTimeout( () => {
			navigation.navigate( returnScreenName, {
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
		// See https://github.com/WordPress/gutenberg/pull/41166
	}, [ inputValue ] );
};

export default LinkPickerScreen;
