/**
 * External dependencies
 */
import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import LinkSettings from './';

const LinkSettingsScreen = ( props ) => {
	const navigation = useNavigation();
	const route = useRoute();
	const { url = '' } = props.attributes || {};
	const { inputValue = url } = route.params || {};

	const onLinkCellPressed = () => {
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
