/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { View } from '../../view';
import { useNavigatorBackLink } from './hook';
import type { NavigatorBackLinkProps } from '../types';

function NavigatorBackLink(
	props: WordPressComponentProps< NavigatorBackLinkProps, 'button' >,
	forwardedRef: Ref< any >
) {
	const navigatorBackLinkProps = useNavigatorBackLink( props );

	return <View ref={ forwardedRef } { ...navigatorBackLinkProps } />;
}

/**
 * TODO: add example
 */
const ConnectedNavigatorBackLink = contextConnect(
	NavigatorBackLink,
	'NavigatorBackLink'
);

export default ConnectedNavigatorBackLink;
