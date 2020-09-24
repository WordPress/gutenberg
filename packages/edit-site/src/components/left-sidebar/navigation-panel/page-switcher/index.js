/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { getPathAndQueryString } from '@wordpress/url';
import { useSelect } from '@wordpress/data';
import {
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';

const NavigationEntityItems = ( props ) => {
	const {
		kind,
		name,
		query = {},

		renderItem,
	} = props;

	const entities = useSelect(
		( select ) => {
			const { getEntityRecords } = select( 'core' );
			return getEntityRecords( kind, name, query );
		},
		[ kind, name, query ]
	);

	if ( ! entities ) {
		return null;
	}

	return entities.map( ( entity ) => {
		const key = `${ kind }-${ name }-${ entity.id }`;

		return (
			<Fragment key={ key }>
				{ renderItem( {
					ItemComponent: NavigationItem,
					entity,
					item: key,
					props: {
						item: key,
					},
				} ) }
			</Fragment>
		);
	} );
};

export default function PageSwitcher( { onChangePage } ) {
	const onPageSelect = ( { type, slug, link, id }, item ) => {
		onChangePage(
			{
				type,
				slug,
				path: getPathAndQueryString( link ),
				context: {
					postType: type,
					postId: id,
				},
			},
			item
		);
	};

	return (
		<>
			<NavigationGroup title="Pages">
				<NavigationEntityItems
					kind="postType"
					name="page"
					renderItem={ ( { ItemComponent, entity, item, props } ) => (
						<ItemComponent
							{ ...props }
							item={ getPathAndQueryString( entity.link ) }
							title={ entity.title.rendered }
							onClick={ () => onPageSelect( entity, item ) }
						/>
					) }
				/>
			</NavigationGroup>

			<NavigationGroup title="Categories">
				<NavigationEntityItems
					kind="taxonomy"
					name="category"
					renderItem={ ( { ItemComponent, entity, item, props } ) => (
						<ItemComponent
							{ ...props }
							item={ getPathAndQueryString( entity.link ) }
							title={ entity.name }
							onClick={ () => onPageSelect( entity, item ) }
						/>
					) }
				/>
			</NavigationGroup>

			<NavigationGroup title="Posts">
				<NavigationEntityItems
					kind="postType"
					name="post"
					renderItem={ ( { ItemComponent, entity, item, props } ) => (
						<ItemComponent
							{ ...props }
							item={ getPathAndQueryString( entity.link ) }
							title={ entity.title.rendered }
							onClick={ () => onPageSelect( entity, item ) }
						/>
					) }
				/>
			</NavigationGroup>
		</>
	);
}
