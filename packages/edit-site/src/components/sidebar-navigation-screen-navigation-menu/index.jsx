import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import SingleNavigationMenu from './single-navigation-menu';
import useNavigationMenuHandlers from './use-navigation-menu-handlers';
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
