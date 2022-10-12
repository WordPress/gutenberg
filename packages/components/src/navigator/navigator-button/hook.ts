/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { escapeAttribute } from '@wordpress/escape-html';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import Button from '../../button';
import useNavigator from '../use-navigator';
import type { NavigatorButtonProps } from '../types';

const cssSelectorForAttribute = ( attrName: string, attrValue: string ) =>
	`[${ attrName }="${ attrValue }"]`;

export function useNavigatorButton(
	props: WordPressComponentProps< NavigatorButtonProps, 'button' >
) {
	const {
		path,
		onClick,
		as = Button,
		attributeName = 'id',
		...otherProps
	} = useContextSystem( props, 'NavigatorButton' );

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
