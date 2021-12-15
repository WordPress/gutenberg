/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
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
		as = 'button',
		attributeName = 'id',
		...otherProps
	} = useContextSystem( props, 'NavigatorLink' );

	const { push } = useNavigator();
	const handleClick: React.MouseEventHandler< HTMLElement > = useCallback(
		( e ) => {
			e.preventDefault();
			push( path, {
				focusTargetSelector: cssSelectorForAttribute(
					attributeName,
					path
				),
			} );
			onClick?.( e );
		},
		[ push, onClick ]
	);

	return {
		as,
		onClick: handleClick,
		path,
		...otherProps,
		[ attributeName ]: path,
	};
}
