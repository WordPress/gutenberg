/**
 * WordPress dependencies
 */
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { getPathAndQueryString } from '@wordpress/url';

const getTitle = ( entity ) =>
	entity.taxonomy ? entity.name : entity?.title?.rendered;

export default function ContentNavigationItem( { item } ) {
	const { setPage } = useDispatch( 'core/edit-site' );

	const onActivateItem = useCallback(
		( { type, slug, link, id } ) => {
			setPage( {
				type,
				slug,
				path: getPathAndQueryString( link ),
				context: {
					postType: type,
					postId: id,
				},
			} );
		},
		[ setPage ]
	);

	if ( ! item ) {
		return null;
	}

	return (
		<NavigationItem
			className="edit-site-navigation-panel__content-item"
			item={ `${ item.taxonomy || item.type }-${ item.id }` }
			title={ getTitle( item ) }
			onClick={ onActivateItem }
		/>
	);
}
