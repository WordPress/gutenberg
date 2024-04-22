/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import useNavigator from '../use-navigator';
import type { NavigatorBackButtonHookProps } from '../types';

export function useNavigatorBackButton(
	props: WordPressComponentProps<
		NavigatorBackButtonHookProps,
		'button',
		false
	>
) {
	const {
		onClick,
		goToParent: goToParentProp = false,
		...otherProps
	} = useContextSystem( props, 'NavigatorBackButton' );

	const { goBack, goToParent } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLButtonElement > =
		useCallback(
			( e ) => {
				e.preventDefault();
				if ( goToParentProp ) {
					goToParent();
				} else {
					goBack();
				}
				onClick?.( e );
			},
			[ goToParentProp, goToParent, goBack, onClick ]
		);

	return {
		onClick: handleClick,
		...otherProps,
	};
}
