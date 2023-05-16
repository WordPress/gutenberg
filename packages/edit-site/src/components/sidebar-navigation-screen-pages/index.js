/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { layout, page, home, loop, plus } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarButton from '../sidebar-button';
import { unlock } from '../../private-apis';

const PageItem = ( { postType = 'page', postId, ...props } ) => {
	const { useHistory } = unlock( routerPrivateApis );
	const history = useHistory();
	const linkInfo = useLink( {
		postType,
		postId,
	} );
	const handleNavigationItemHover = ( event ) => {
		event.stopPropagation();
		history.push( {
			path: '/' + 'page',
			postId,
			postType: 'page',
		} );
	};

	return (
		<SidebarNavigationItem
			onMouseEnter={ handleNavigationItemHover }
			{ ...linkInfo }
			{ ...props }
		/>
	);
};

export default function SidebarNavigationScreenPages() {
	const { records: pages, isResolving: isLoadingPages } = useEntityRecords(
		'postType',
		'page'
	);

	const { records: templates, isResolving: isLoadingTemplates } =
		useEntityRecords( 'postType', 'wp_template', {
			per_page: -1,
		} );

	const dynamicPageTemplates =
		templates &&
		templates.filter( ( template ) => {
			return template.slug === '404' || template.slug === 'search';
		} );

	const homeTemplate =
		templates?.find( ( template ) => template.slug === 'front-page' ) ||
		templates?.find( ( template ) => template.slug === 'home' ) ||
		templates?.find( ( template ) => template.slug === 'index' );

	const pagesAndTemplates = pages?.concat( dynamicPageTemplates, [
		homeTemplate,
	] );

	const { frontPage, postsPage } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );

		const siteSettings = getEntityRecord( 'root', 'site' );
		return {
			frontPage: siteSettings?.page_on_front,
			postsPage: siteSettings?.page_for_posts,
		};
	}, [] );

	const isHomePageBlog = frontPage === postsPage;

	if ( ! isHomePageBlog ) {
		const homePageIndex = pagesAndTemplates?.findIndex(
			( item ) => item.id === frontPage
		);
		const homePage = pages?.splice( homePageIndex, 1 );
		pages?.splice( 0, 0, ...homePage );
	}
	const { setIsCreatePageModalOpened } = useDispatch( editSiteStore );

	return (
		<SidebarNavigationScreen
			title={ __( 'Pages' ) }
			description={ __( 'Browse and edit pages on your site.' ) }
			actions={
				<SidebarButton
					icon={ plus }
					label={ __( 'Draft a new page' ) }
					onClick={ () =>
						setIsCreatePageModalOpened( true, {
							redirectAfterSave: false,
						} )
					}
				/>
			}
			content={
				<>
					{ ( isLoadingPages || isLoadingTemplates ) && (
						<ItemGroup>
							<Item>{ __( 'Loading pages' ) }</Item>
						</ItemGroup>
					) }
					{ ! ( isLoadingPages || isLoadingTemplates ) && (
						<ItemGroup>
							{ ! pagesAndTemplates?.length && (
								<Item>{ __( 'No page found' ) }</Item>
							) }
							{ isHomePageBlog && homeTemplate && (
								<PageItem
									postType="wp_template"
									postId={ homeTemplate.id }
									key={ homeTemplate.id }
									icon={ home }
									withChevron
								>
									{ decodeEntities(
										homeTemplate.title?.rendered
									) ?? __( '(no title)' ) }
								</PageItem>
							) }
							{ pages?.map( ( item ) => {
								const pageIsFrontPage = item.id === frontPage;
								const pageIsPostsPage = item.id === postsPage;
								let itemIcon;
								switch ( item.id ) {
									case frontPage:
										itemIcon = home;
										break;
									case postsPage:
										itemIcon = loop;
										break;
									default:
										itemIcon = page;
								}
								return (
									<PageItem
										postId={ item.id }
										key={ item.id }
										icon={ itemIcon }
										withChevron
									>
										{ decodeEntities(
											item.title?.rendered
										) ?? __( '(no title)' ) }
										{ pageIsFrontPage &&
											__( ' (Front Page)' ) }
										{ pageIsPostsPage &&
											__( ' (Posts Page)' ) }
									</PageItem>
								);
							} ) }
							{ dynamicPageTemplates?.map( ( item ) => (
								<PageItem
									postType="wp_template"
									postId={ item.id }
									key={ item.id }
									icon={ layout }
									withChevron
								>
									{ decodeEntities( item.title?.rendered ) ??
										__( '(no title)' ) }
								</PageItem>
							) ) }
							<SidebarNavigationItem
								className="edit-site-sidebar-navigation-screen-pages__see-all"
								href="edit.php?post_type=page"
								onClick={ () => {
									document.location =
										'edit.php?post_type=page';
								} }
							>
								{ __( 'Manage all pages' ) }
							</SidebarNavigationItem>
						</ItemGroup>
					) }
				</>
			}
		/>
	);
}
