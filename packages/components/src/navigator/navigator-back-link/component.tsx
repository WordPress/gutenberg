/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { View } from '../../view';
import useNavigator from '../use-navigator';
import type { NavigatorBackLinkProps } from '../types';

function NavigatorBackLink(
	props: WordPressComponentProps< NavigatorBackLinkProps, 'button' >,
	forwardedRef: Ref< any >
) {
	const {
		children,
		onClick,
		as = 'button',
		...otherProps
	} = useContextSystem( props, 'NavigatorBackLink' );

	const { pop } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLElement > = useCallback(
		( e ) => {
			e.preventDefault();
			pop();
			onClick?.( e );
		},
		[ pop, onClick ]
	);

	return (
		<View
			as={ as }
			ref={ forwardedRef }
			onClick={ handleClick }
			{ ...otherProps }
		>
			{ children }
		</View>
	);
}

/**
 * TODO: add example
 */
const ConnectedNavigatorBackLink = contextConnect(
	NavigatorBackLink,
	'NavigatorBackLink'
);

export default ConnectedNavigatorBackLink;
