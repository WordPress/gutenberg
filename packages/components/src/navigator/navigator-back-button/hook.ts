/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import Button from '../../button';
import useNavigator from '../use-navigator';
import type { NavigatorBackButtonHookProps } from '../types';

export function useNavigatorBackButton(
	props: WordPressComponentProps< NavigatorBackButtonHookProps, 'button' >
) {
	const {
		onClick,
		as = Button,

		// Deprecated
		goToParent,

		...otherProps
	} = useContextSystem( props, 'NavigatorBackButton' );

	const { goBack } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLButtonElement > =
		useCallback(
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
