/**
 * External dependencies
 */
import React from 'react';
import { InteractionManager } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { LinkPicker } from './';
import { BottomSheetContext } from '../bottom-sheet/bottom-sheet-context';

const LinkPickerScreen = ( { returnScreenName } ) => {
	const navigation = useNavigation();
	const route = useRoute();
	const { setIsChildrenScrollable } = useContext( BottomSheetContext );

	const onLinkPicked = ( { url, title } ) => {
		navigation.navigate( returnScreenName, {
			inputValue: url,
			text: title,
		} );
		InteractionManager.runAfterInteractions( () => {
			setIsChildrenScrollable( false );
		} );
	};

	const onCancel = () => {
		navigation.goBack();
		InteractionManager.runAfterInteractions( () => {
			setIsChildrenScrollable( false );
		} );
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
