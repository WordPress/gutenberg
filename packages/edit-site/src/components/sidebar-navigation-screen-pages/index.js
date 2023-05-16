/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { plus } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import SidebarNavigationSubtitle from '../sidebar-navigation-subtitle';
import SidebarButton from '../sidebar-button';

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
		'page'
	);

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
							redirectAfterSave: true,
						} )
					}
				/>
			}
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
										{ decodeEntities(
											page.title?.rendered
										) ?? __( '(no title)' ) }
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
