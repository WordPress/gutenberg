/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationSubtitle from '../sidebar-navigation-subtitle';

const PageItem = ( { postId, ...props } ) => {
	const linkInfo = useLink( {
		postType: 'page',
		postId,
	} );
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};

export default function SidebarNavigationScreenPages() {
	const { records: pages, isResolving: isLoading } = useEntityRecords(
		'postType',
		'page',
		{ status: 'any' }
	);

	return (
		<SidebarNavigationScreen
			title={ __( 'Pages' ) }
			description={ __( 'Browse and edit pages on your site.' ) }
			content={
				<>
					{ isLoading && (
						<ItemGroup>
							<Item>{ __( 'Loading pages' ) }</Item>
						</ItemGroup>
					) }
					{ ! isLoading && (
						<>
							<SidebarNavigationSubtitle>
								{ __( 'Recent' ) }
							</SidebarNavigationSubtitle>
							<ItemGroup>
								{ ! pages?.length && (
									<Item>{ __( 'No page found' ) }</Item>
								) }
								{ pages?.map( ( page ) => (
									<PageItem
										postId={ page.id }
										key={ page.id }
										withChevron
									>
										<Truncate numberOfLines={ 1 }>
											{ decodeEntities(
												page.title?.rendered
											) ?? __( 'Untitled' ) }
										</Truncate>
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
						</>
					) }
				</>
			}
		/>
	);
}
