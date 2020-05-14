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

function getPathFromLink( link ) {
	const path = getPath( link );
	const queryString = getQueryString( link );
	let value = '/';
	if ( path ) value += path;
	if ( queryString ) value += `?${ queryString }`;
	return value;
}
export default function PageSwitcher( { activePage, onActivePageChange } ) {
	const { pages = [], categories = [] } = useSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );
		return {
			pages: getEntityRecords( 'postType', 'page' )?.map( ( _page ) => {
				const path = getPathFromLink( _page.link );
				return {
					label: _page.title.rendered,
					value: path,
					context: { postType: 'page', postId: _page.id },
				};
			} ),
			categories: getEntityRecords( 'taxonomy', 'category' )?.map(
				( category ) => {
					const path = getPathFromLink( category.link );
					return {
						label: category.name,
						value: path,
						context: { query: { categoryId: category.id } },
					};
				}
			),
		};
	}, [] );
	const onPageSelect = ( newPath ) => {
		const { value: path, context } = [ ...pages, ...categories ].find(
			( choice ) => choice.value === newPath
		);
		onActivePageChange( { path, context } );
	};
	return (
		<DropdownMenu
			icon={ null }
			label={ __( 'Switch Page' ) }
			toggleProps={ {
				children: [ ...pages, ...categories ].find(
					( choice ) => choice.value === activePage.path
				)?.label,
			} }
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
				</>
			) }
		</DropdownMenu>
	);
}
