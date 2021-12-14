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
import type { NavigatorLinkProps } from '../types';

const defaultAttributeName = 'id';
const defaultSelectorFactory = ( attrName: string, attrValue: string ) =>
	`[${ attrName }="${ attrValue }"]`;

function NavigatorLink(
	props: WordPressComponentProps< NavigatorLinkProps, 'a' >,
	forwardedRef: Ref< any >
) {
	const {
		path,
		children,
		onClick,
		as = 'button',
		attributeName = defaultAttributeName,
		selectorFactory = defaultSelectorFactory,
		...otherProps
	} = useContextSystem( props, 'NavigatorLink' );

	const { push } = useNavigator();
	const focusTargetSelector = selectorFactory( attributeName, path );
	const handleClick: React.MouseEventHandler< HTMLElement > = useCallback(
		( e ) => {
			e.preventDefault();
			push( path, { focusTargetSelector } );
			onClick?.( e );
		},
		[ push, selectorFactory, onClick ]
	);

	const linkProps = { [ attributeName ]: path, path, ...otherProps };

	return (
		<View
			as={ as }
			ref={ forwardedRef }
			onClick={ handleClick }
			{ ...linkProps }
		>
			{ children }
		</View>
	);
}

/**
 * TODO: add example
 */
const ConnectedNavigatorLink = contextConnect( NavigatorLink, 'NavigatorLink' );

export default ConnectedNavigatorLink;
