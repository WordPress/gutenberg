/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';
import { getPathAndQueryString } from '@wordpress/url';

const EXTRACTORS_TITLE = {
	'taxonomy-category': ( entity ) => entity.name,
	default: ( entity ) => entity?.title?.rendered,
};

export default function NavigationEntityItems( { kind, name, query = {} } ) {
	const entities = useSelect(
		( select ) => select( 'core' ).getEntityRecords( kind, name, query ),
		[ kind, name, query ]
	);

	const { setPage } = useDispatch( 'core/edit-site' );

	if ( ! entities ) {
		return null;
	}

	const changePage = ( { type, slug, link, id } ) => {
		setPage( {
			type,
			slug,
			path: getPathAndQueryString( link ),
			context: {
				postType: type,
				postId: id,
			},
		} );
	};

	return entities.map( ( entity ) => {
		const key = `content-${ getPathAndQueryString( entity.link ) }`;
		const titleExtractor =
			EXTRACTORS_TITLE[ `${ kind }-${ name }` ] ||
			EXTRACTORS_TITLE.default;

		return (
			<NavigationItem
				key={ key }
				item={ key }
				title={ titleExtractor( entity ) }
				onClick={ () => changePage( entity ) }
			/>
		);
	} );
}
