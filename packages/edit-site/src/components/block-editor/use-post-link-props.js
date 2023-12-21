/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArgs, removeQueryArgs } from '@wordpress/url';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export function usePostLinkProps() {
	const history = useHistory();
	const getPostLinkProps = useCallback(
		( params ) => {
			const currentArgs = getQueryArgs( window.location.href );
			const currentUrlWithoutArgs = removeQueryArgs(
				window.location.href,
				...Object.keys( currentArgs )
			);

			const newUrl = addQueryArgs( currentUrlWithoutArgs, {
				post: params.postId,
				action: 'edit',
			} );

			return {
				href: newUrl,
				onClick: ( event ) => {
					event.preventDefault();
					history.push( params );
				},
			};
		},
		[ history ]
	);

	return getPostLinkProps;
}
