import { useCallback } from '@wordpress/element';
import type { HookReturnProps, WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import Button from '../../button';
import { useNavigator } from '../use-navigator';
import type { NavigatorBackButtonProps } from '../types';

export function useNavigatorBackButton(
	props: WordPressComponentProps< NavigatorBackButtonProps, 'button' >
): HookReturnProps<
	WordPressComponentProps< NavigatorBackButtonProps, 'button' >,
	never,
	{
		as:
			| NonNullable<
					WordPressComponentProps<
						NavigatorBackButtonProps,
						'button'
					>[ 'as' ]
			  >
			| typeof Button;
		onClick: React.MouseEventHandler< HTMLButtonElement >;
	}
> {
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
