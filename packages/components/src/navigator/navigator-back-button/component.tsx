/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { View } from '../../view';
import { useNavigatorBackButton } from './hook';
import type { NavigatorBackButtonProps } from '../types';

function UnconnectedNavigatorBackButton(
	props: WordPressComponentProps< NavigatorBackButtonProps, 'button' >,
	forwardedRef: ForwardedRef< any >
) {
	const navigatorBackButtonProps = useNavigatorBackButton( props );

	return <View ref={ forwardedRef } { ...navigatorBackButtonProps } />;
}

export const NavigatorBackButton = contextConnect(
	UnconnectedNavigatorBackButton,
	'Navigator.BackButton'
);
