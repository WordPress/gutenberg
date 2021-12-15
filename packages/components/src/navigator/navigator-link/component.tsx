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
import { useNavigatorLink } from './hook';
import type { NavigatorLinkProps } from '../types';

function NavigatorLink(
	props: WordPressComponentProps< NavigatorLinkProps, 'button' >,
	forwardedRef: Ref< any >
) {
	const navigatorLinkProps = useNavigatorLink( props );

	return <View ref={ forwardedRef } { ...navigatorLinkProps } />;
}

/**
 * TODO: add example
 */
const ConnectedNavigatorLink = contextConnect( NavigatorLink, 'NavigatorLink' );

export default ConnectedNavigatorLink;
