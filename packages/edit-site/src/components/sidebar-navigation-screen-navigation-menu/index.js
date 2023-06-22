/**
 * WordPress dependencies
 */
import {
	useEntityRecord,
	useEntityRecords,
	store as coreStore,
} from '@wordpress/core-data';

import {
	__experimentalUseNavigator as useNavigator,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { PRELOADED_NAVIGATION_MENUS_QUERY } from '../sidebar-navigation-screen-navigation-menus/constants';
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import ScreenNavigationMoreMenu from './more-menu';
import SingleNavigationMenu from './single-navigation-menu';
import useNavigationMenuHandlers from './use-navigation-menu-handlers';

export const postType = `wp_navigation`;

export default function SidebarNavigationScreenNavigationMenu() {
	const {
		params: { postId },
	} = useNavigator();

	const { record: navigationMenu, isResolving } = useEntityRecord(
		'postType',
		postType,
		postId
	);

	const { records: navigationMenus } = useEntityRecords(
		'postType',
		`wp_navigation`,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const { isSaving, isDeleting } = useSelect(
		( select ) => {
			const {
				isSavingEntityRecord,
				isDeletingEntityRecord,
				getEditedEntityRecord: getEditedEntityRecordSelector,
			} = select( coreStore );

			return {
				isSaving: isSavingEntityRecord( 'postType', postType, postId ),
				isDeleting: isDeletingEntityRecord(
					'postType',
					postType,
					postId
				),
				getEditedEntityRecord: getEditedEntityRecordSelector,
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

	// If we have a single menu then the backpath should skip the
	// navigation menus screen (as that would cause an infinite redirect)
	// and instead go back to the root.
	const backPath = navigationMenus?.length === 1 ? '/' : undefined;

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __(
					'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
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
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ _handleDelete }
						onSave={ _handleSave }
						onDuplicate={ _handleDuplicate }
					/>
				}
				title={ decodeEntities( menuTitle ) }
				description={ __( 'This Navigation Menu is empty.' ) }
				backPath={ backPath }
			/>
		);
	}

	return (
		<SingleNavigationMenu
			navigationMenu={ navigationMenu }
			handleDelete={ _handleDelete }
			handleSave={ _handleSave }
			handleDuplicate={ _handleDuplicate }
			backPath={ backPath }
		/>
	);
}
