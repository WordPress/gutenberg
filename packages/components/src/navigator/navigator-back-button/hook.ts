/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import Button from '../../button';
import useNavigator from '../use-navigator';
import type { NavigatorBackButtonProps } from '../types';

export function useNavigatorBackButton(
	props: WordPressComponentProps< NavigatorBackButtonProps, 'button' >
) {
	const { onClick, as = Button, ...otherProps } = useContextSystem(
		props,
		'NavigatorBackButton'
	);

	const { goBack } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLElement > = useCallback(
		( e ) => {
			e.preventDefault();
			goBack();
			onClick?.( e );
		},
		[ goBack, onClick ]
	);

	return {
		as,
		onClick: handleClick,
		...otherProps,
	};
}
