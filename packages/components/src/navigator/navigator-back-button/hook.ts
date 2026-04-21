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
import { useNavigator } from '../use-navigator';
import type { NavigatorBackButtonProps } from '../types';

export function useNavigatorBackButton(
	props: WordPressComponentProps< NavigatorBackButtonProps, 'button' >
) {
	const {
		onClick,
		as = Button,

		...otherProps
	} = useContextSystem( props, 'Navigator.BackButton' );

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
