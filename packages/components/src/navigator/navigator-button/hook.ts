import { useCallback } from '@wordpress/element';
import { escapeAttribute } from '@wordpress/escape-html';
import type { HookReturnProps, WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import Button from '../../button';
import { useNavigator } from '../use-navigator';
import type { NavigatorButtonProps } from '../types';

const cssSelectorForAttribute = ( attrName: string, attrValue: string ) =>
	`[${ attrName }="${ attrValue }"]`;

export function useNavigatorButton(
	props: WordPressComponentProps< NavigatorButtonProps, 'button' >
): HookReturnProps<
	WordPressComponentProps< NavigatorButtonProps, 'button' >,
	'path' | 'attributeName',
	{
		as:
			| NonNullable<
					WordPressComponentProps<
						NavigatorButtonProps,
						'button'
					>[ 'as' ]
			  >
			| typeof Button;
		onClick: React.MouseEventHandler< HTMLButtonElement >;
	}
> {
	const {
		path,
		onClick,
		as = Button,
		attributeName = 'id',
		...otherProps
	} = useContextSystem( props, 'Navigator.Button' );

	const escapedPath = escapeAttribute( path );

	const { goTo } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLButtonElement > =
		useCallback(
			( e ) => {
				e.preventDefault();
				goTo( escapedPath, {
					focusTargetSelector: cssSelectorForAttribute(
						attributeName,
						escapedPath
					),
				} );
				onClick?.( e );
			},
			[ goTo, onClick, attributeName, escapedPath ]
		);

	return {
		as,
		onClick: handleClick,
		...otherProps,
		[ attributeName ]: escapedPath,
	};
}
