/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import useNavigator from '../use-navigator';
import type { NavigatorBackLinkProps } from '../types';

export function useNavigatorBackLink(
	props: WordPressComponentProps< NavigatorBackLinkProps, 'button' >
) {
	const { onClick, as = 'button', ...otherProps } = useContextSystem(
		props,
		'NavigatorBackLink'
	);

	const { pop } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLElement > = useCallback(
		( e ) => {
			e.preventDefault();
			pop();
			onClick?.( e );
		},
		[ pop, onClick ]
	);

	return {
		as,
		onClick: handleClick,
		...otherProps,
	};
}
