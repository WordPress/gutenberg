/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { layout, page, home, loop, edit, settings } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

const { useLocation } = unlock( routerPrivateApis );

const PageItem = ( { postType = 'page', postId, ...props } ) => {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { params } = useLocation();

	const { useHistory } = unlock( routerPrivateApis );
	const history = useHistory();
	const linkInfo = useLink( {
		postType,
		postId,
		backToPreviousScreen: true,
	} );
	const handleNavigationItemHover = ( event ) => {
		event.stopPropagation();
		history.replace( {
			path: '/' + 'page',
			postId,
			postType: 'page',
		} );
	};

	const handleInfoClick = ( event ) => {
		event.stopPropagation();
		history.push( {
			postId,
			postType: 'page',
		} );
	};

	const handleEditClick = ( event ) => {
		event.stopPropagation();
		setCanvasMode( 'edit' );
		history.push( {
			postId,
			postType: 'page',
		} );
	};

	console.log( 'params:', params, postId );

	return (
		<SidebarNavigationItem
			onClick={ handleNavigationItemHover }
			onFocus={ handleNavigationItemHover }
			linkInfo={ linkInfo }
			isActive={ params.postId === String( postId ) }
			actions={
				<>
					<Button
						isSmall
						variant="tertiary"
						icon={ settings }
						onClick={ handleInfoClick }
					/>
					<Button
						isSmall
						variant="primary"
						icon={ edit }
						onClick={ handleEditClick }
					/>
				</>
			}
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
		const homePageIndex = pages?.findIndex(
			( item ) => item.id === frontPage
		);
		const homePage = pages?.splice( homePageIndex, 1 );
		pages?.splice( 0, 0, ...homePage );

		const postsPageIndex = pages?.findIndex(
			( item ) => item.id === postsPage
		);

		const blogPage = pages?.splice( postsPageIndex, 1 );

		pages?.splice( 1, 0, ...blogPage );
	}

	return (
		<SidebarNavigationScreen
			title={ __( 'Pages' ) }
			description={ __( 'Browse and edit pages on your site.' ) }
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
									>
										{ decodeEntities(
											item.title?.rendered
										) ?? __( '(no title)' ) }
										{ pageIsFrontPage && (
											<Text className="edit-site-sidebar-navigation-item__type">
												{ __( ' - Front Page' ) }
											</Text>
										) }
										{ pageIsPostsPage && (
											<Text className="edit-site-sidebar-navigation-item__type">
												{ __( ' - Posts Page' ) }
											</Text>
										) }
									</PageItem>
								);
							} ) }
							{ dynamicPageTemplates?.map( ( item ) => (
								<PageItem
									postType="wp_template"
									postId={ item.id }
									key={ item.id }
									icon={ layout }
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
