/**
 * External dependencies
 */
import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { BottomSheetContext } from '../bottom-sheet/bottom-sheet-context';
import LinkSettings from './';

const LinkSettingsScreen = ( props ) => {
	const navigation = useNavigation();
	const route = useRoute();
	const { setIsChildrenScrollable } = useContext( BottomSheetContext );
	const { url = '' } = props.attributes || {};
	const { inputValue = url } = route.params || {};

	const onLinkCellPressed = () => {
		// setIsChildrenScrollable( true );
		navigation.navigate( 'linkPicker', { inputValue } );
	};

	return useMemo( () => {
		return (
			<LinkSettings
				onLinkCellPressed={ onLinkCellPressed }
				urlValue={ inputValue }
				{ ...props }
			/>
		);
	}, [ props, inputValue, navigation, route ] );
};

export default LinkSettingsScreen;
