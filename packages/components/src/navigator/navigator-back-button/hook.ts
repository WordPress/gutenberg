/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

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

	if ( goToParent !== undefined ) {
		deprecated( '`goToParent` prop in wp.components.NavigatorBackButton', {
			since: '6.7',
			alternative:
				'"back" navigations are always treated as going to the parent screen',
		} );
	}

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
