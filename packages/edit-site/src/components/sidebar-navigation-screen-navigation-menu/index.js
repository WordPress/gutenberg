/**
 * WordPress dependencies
 */
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import ScreenNavigationMoreMenu from './more-menu';
import SingleNavigationMenu from './single-navigation-menu';
import useNavigationMenuHandlers from './use-navigation-menu-handlers';
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

export const postType = `wp_navigation`;

export default function SidebarNavigationScreenNavigationMenu( { backPath } ) {
	const {
		params: { postId },
	} = useLocation();

	const { record: navigationMenu, isResolving } = useEntityRecord(
		'postType',
		postType,
		postId
	);

	const { isSaving, isDeleting } = useSelect(
		( select ) => {
			const { isSavingEntityRecord, isDeletingEntityRecord } =
				select( coreStore );

			return {
				isSaving: isSavingEntityRecord( 'postType', postType, postId ),
				isDeleting: isDeletingEntityRecord(
					'postType',
					postType,
					postId
				),
			};
		},
		[ postId ]
	);

	const isLoading = isResolving || isSaving || isDeleting;

	const menuTitle = navigationMenu?.title?.rendered || navigationMenu?.slug;

	const { handleSave, handleDelete, handleDuplicate } =
		useNavigationMenuHandlers();

	const _handleDelete = () => handleDelete( navigationMenu );
	const _handleSave = ( edits ) => handleSave( navigationMenu, edits );
	const _handleDuplicate = () => handleDuplicate( navigationMenu );

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __(
					'Navigation Menus are a curated collection of blocks that allow visitors to get around your site.'
				) }
				backPath={ backPath }
			>
				<Spinner className="edit-site-sidebar-navigation-screen-navigation-menus__loading" />
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! isLoading && ! navigationMenu ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __( 'Navigation Menu missing.' ) }
				backPath={ backPath }
			/>
		);
	}

	if ( ! navigationMenu?.content?.raw ) {
		return (
			<SidebarNavigationScreenWrapper
				actions={
					<ScreenNavigationMoreMenu
						menuId={ navigationMenu?.id }
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ _handleDelete }
						onSave={ _handleSave }
						onDuplicate={ _handleDuplicate }
					/>
				}
				backPath={ backPath }
				title={ buildNavigationLabel(
					navigationMenu?.title,
					navigationMenu?.id,
					navigationMenu?.status
				) }
				description={ __( 'This Navigation Menu is empty.' ) }
			/>
		);
	}

	return (
		<SingleNavigationMenu
			navigationMenu={ navigationMenu }
			backPath={ backPath }
			handleDelete={ _handleDelete }
			handleSave={ _handleSave }
			handleDuplicate={ _handleDuplicate }
		/>
	);
}
