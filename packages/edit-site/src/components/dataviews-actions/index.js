import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export const useQuickEditPostAction = () => {
	const history = useHistory();
	const { path, query } = useLocation();
	return useMemo(
		() => ( {
			id: 'quick-edit',
			label: ( items ) =>
				items.length > 1 ? __( 'Bulk edit' ) : __( 'Quick edit' ),
			icon: drawerRight,
			isPrimary: true,
			supportsBulk: true,
			isEligible( post ) {
				if ( post.status === 'trash' ) {
					return false;
				}

				return post.type === 'page';
			},
			callback( items ) {
				history.navigate(
					addQueryArgs( path, {
						...query,
						quickEdit: true,
						postId: items.map( ( item ) => item.id ).join( ',' ),
					} )
				);
			},
		} ),
		[ history, path, query ]
	);
};
