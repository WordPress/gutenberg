/**
 * WordPress dependencies
 */
import {
	__experimentalTruncate as Truncate,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { layout } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import DataViewsSidebarContent from '../sidebar-dataviews';

const PageItem = ( { postType = 'page', postId, ...props } ) => {
	const linkInfo = useLink(
		{
			postType,
			postId,
		},
		{
			backPath: '/page',
		}
	);
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};

export default function SidebarNavigationScreenPagesDataViews() {
	const { records: templateRecords } = useEntityRecords(
		'postType',
		TEMPLATE_POST_TYPE,
		{
			per_page: -1,
		}
	);

	const { frontPage, postsPage } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );
		return {
			frontPage: siteSettings?.page_on_front,
			postsPage: siteSettings?.page_for_posts,
		};
	}, [] );

	const templates = useMemo( () => {
		if ( ! templateRecords ) {
			return [];
		}

		const isHomePageBlog = frontPage === postsPage;
		const homeTemplate =
			templateRecords?.find(
				( template ) => template.slug === 'front-page'
			) ||
			templateRecords?.find( ( template ) => template.slug === 'home' ) ||
			templateRecords?.find( ( template ) => template.slug === 'index' );

		return [
			isHomePageBlog ? homeTemplate : null,
			...templateRecords?.filter( ( { slug } ) =>
				[ '404', 'search' ].includes( slug )
			),
		].filter( Boolean );
	}, [ templateRecords, frontPage, postsPage ] );

	return (
		<SidebarNavigationScreen
			title={ __( 'Pages' ) }
			content={ <DataViewsSidebarContent /> }
			footer={
				<VStack spacing={ 0 }>
					{ templates?.map( ( item ) => (
						<PageItem
							postType={ TEMPLATE_POST_TYPE }
							postId={ item.id }
							key={ item.id }
							icon={ layout }
							withChevron
						>
							<Truncate numberOfLines={ 1 }>
								{ decodeEntities(
									item.title?.rendered || __( '(no title)' )
								) }
							</Truncate>
						</PageItem>
					) ) }
				</VStack>
			}
		/>
	);
}
