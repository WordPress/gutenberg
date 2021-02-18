/**
 * WordPress dependencies
 */
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getPathAndQueryString } from '@wordpress/url';

const getTitle = ( entity ) =>
	entity.taxonomy ? entity.name : entity?.title?.rendered;

export default function ContentNavigationItem( { item } ) {
	const { setPage } = useDispatch( 'core/edit-site' );

	const onActivateItem = useCallback( () => {
		const { type, slug, link, id } = item;
		setPage( {
			type,
			slug,
			path: getPathAndQueryString( link ),
			context: {
				postType: type,
				postId: id,
			},
		} );
	}, [ setPage, item ] );

	if ( ! item ) {
		return null;
	}

	return (
		<NavigationItem
			className="edit-site-navigation-panel__content-item"
			item={ `${ item.taxonomy || item.type }-${ item.id }` }
			title={ getTitle( item ) || __( '(no title)' ) }
			onClick={ onActivateItem }
		/>
	);
}
