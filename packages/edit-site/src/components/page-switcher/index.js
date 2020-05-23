/**
 * WordPress dependencies
 */
import { getPath, getQueryString } from '@wordpress/url';
import { useSelect } from '@wordpress/data';
import {
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { __experimentalLinkControl as LinkControl } from '@wordpress/block-editor';

function getPathFromLink( link ) {
	const path = getPath( link );
	const queryString = getQueryString( link );
	let value = '/';
	if ( path ) value += path;
	if ( queryString ) value += `?${ queryString }`;
	return value;
}
export default function PageSwitcher( {
	showOnFront,
	activePage,
	onActivePageChange,
} ) {
	const { pages = [], categories = [], posts = [] } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( 'core' );
			const pageGroups = {
				pages: getEntityRecords( 'postType', 'page' )?.map(
					( _page ) => {
						const path = getPathFromLink( _page.link );
						return {
							label: _page.title.rendered,
							type: 'page',
							slug: _page.slug,
							value: path,
							context: {
								postType: 'page',
								postId: _page.id,
							},
						};
					}
				),
				categories: getEntityRecords( 'taxonomy', 'category' )?.map(
					( category ) => {
						const path = getPathFromLink( category.link );
						return {
							label: category.name,
							type: 'category',
							slug: category.slug,
							value: path,
							context: {
								query: { categoryIds: [ category.id ] },
								queryContext: { page: 1 },
							},
						};
					}
				),
				posts: [],
			};
			if ( showOnFront === 'posts' )
				pageGroups.posts.unshift( {
					label: __( 'All Posts' ),
					value: '/',
					context: {
						query: { categoryIds: [] },
						queryContext: { page: 1 },
					},
				} );
			return pageGroups;
		},
		[ showOnFront ]
	);

	const onPageSelect = ( newPath ) => {
		const { value: path, ...rest } = [ ...pages, ...categories ].find(
			( choice ) => choice.value === newPath
		);
		onActivePageChange( { ...rest, path } );
	};
	const onPostSelect = ( post ) =>
		onActivePageChange( {
			type: 'post',
			slug: post.slug,
			path: getPathFromLink( post.url ),
			context: { postType: post.type, postId: post.id },
		} );
	return (
		<DropdownMenu
			icon={ null }
			label={ __( 'Switch Page' ) }
			toggleProps={ {
				children:
					[ ...pages, ...categories, ...posts ].find(
						( choice ) => choice.value === activePage.path
					)?.label || activePage.path,
			} }
			menuProps={ { className: 'edit-site-page-switcher__menu' } }
		>
			{ () => (
				<>
					<MenuGroup label={ __( 'Pages' ) }>
						<MenuItemsChoice
							choices={ pages }
							value={ activePage.path }
							onSelect={ onPageSelect }
						/>
					</MenuGroup>
					<MenuGroup label={ __( 'Categories' ) }>
						<MenuItemsChoice
							choices={ categories }
							value={ activePage.path }
							onSelect={ onPageSelect }
						/>
					</MenuGroup>
					<MenuGroup label={ __( 'Posts' ) }>
						<MenuItemsChoice
							choices={ posts }
							value={ activePage.path }
							onSelect={ onPageSelect }
						/>
						<LinkControl
							searchInputPlaceholder={ __( 'Search for Post' ) }
							onChange={ onPostSelect }
							settings={ {} }
							noDirectEntry
							showInitialSuggestions
						/>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
