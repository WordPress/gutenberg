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
import type { NavigatorLinkProps } from '../types';

const cssSelectorForAttribute = ( attrName: string, attrValue: string ) =>
	`[${ attrName }="${ attrValue }"]`;

export function useNavigatorLink(
	props: WordPressComponentProps< NavigatorLinkProps, 'button' >
) {
	const {
		path,
		onClick,
		as = Button,
		attributeName = 'id',
		...otherProps
	} = useContextSystem( props, 'NavigatorLink' );

	const { goTo } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLElement > = useCallback(
		( e ) => {
			e.preventDefault();
			goTo( path, {
				focusTargetSelector: cssSelectorForAttribute(
					attributeName,
					path
				),
			} );
			onClick?.( e );
		},
		[ goTo, onClick ]
	);

	return {
		as,
		onClick: handleClick,
		path,
		...otherProps,
		[ attributeName ]: path,
	};
}
