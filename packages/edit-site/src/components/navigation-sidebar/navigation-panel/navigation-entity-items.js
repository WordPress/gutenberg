/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';
import { getPathAndQueryString } from '@wordpress/url';

const getEntityTitle = ( kind, entity ) =>
	'taxonomy' === kind ? entity.name : entity?.title?.rendered;

export default function NavigationEntityItems( { kind, name, query = {} } ) {
	const entities = useSelect(
		( select ) => select( 'core' ).getEntityRecords( kind, name, query ),
		[ kind, name, query ]
	);

	const { setPage } = useDispatch( 'core/edit-site' );

	if ( ! entities ) {
		return null;
	}

	const onActivateItem = ( { type, slug, link, id, taxonomy } ) => {
		const context = taxonomy
			? { taxonomy, termId: id }
			: { postType: type, postId: id };
		setPage( {
			type,
			slug,
			path: getPathAndQueryString( link ),
			context,
		} );
	};

	return entities.map( ( entity ) => {
		const key = `content-${ getPathAndQueryString( entity.link ) }`;

		return (
			<NavigationItem
				key={ key }
				item={ key }
				title={ getEntityTitle( kind, entity ) }
				onClick={ () => onActivateItem( entity ) }
			/>
		);
	} );
}
