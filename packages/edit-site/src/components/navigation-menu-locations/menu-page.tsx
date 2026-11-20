import { Page } from '@wordpress/admin-ui';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/ui';
import ScreenNavigationMoreMenu from '../sidebar-navigation-screen-navigation-menu/more-menu';
import NavigationMenuEditor from '../sidebar-navigation-screen-navigation-menu/navigation-menu-editor';
import useNavigationMenuHandlers from '../sidebar-navigation-screen-navigation-menu/use-navigation-menu-handlers';
import { useMenuDescription } from '../sidebar-navigation-screen-navigation-menu/single-navigation-menu';
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

const STYLES = {
	items: {
		padding: 'var(--wpds-dimension-padding-xl, 24px)',
	},
	centered: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: '100%',
	},
} as const;

/**
 * A menu's items, in the white area between the menus list and the canvas,
 * the same way the Pages screen lists pages. The dark sidebar is left to
 * getting around, and the canvas shows the preview and locations.
 *
 * @param props
 * @param props.navigationId The menu's ID.
 */
export default function NavigationMenuPage( {
	navigationId,
}: {
	navigationId: number;
} ) {
	const { record: menu, isResolving } = useEntityRecord< any >(
		'postType',
		NAVIGATION_POST_TYPE,
		navigationId
	);
	const isBusy = useSelect(
		( select ) =>
			select( coreStore ).isDeletingEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				navigationId
			),
		[ navigationId ]
	);
	const { handleSave, handleDelete, handleDuplicate } =
		useNavigationMenuHandlers();
	const description = useMenuDescription( navigationId );

	if ( ! menu && ( isResolving || isBusy ) ) {
		return (
			<div style={ STYLES.centered }>
				<Spinner />
			</div>
		);
	}
	if ( ! menu ) {
		return (
			<Page title={ __( 'Menu missing.' ) }>
				<span />
			</Page>
		);
	}

	const title = buildNavigationLabel( menu.title, menu.id, menu.status );
	return (
		<Page
			className="edit-site-navigation-menu-page"
			title={ title }
			subTitle={ description ?? undefined }
			actions={
				<ScreenNavigationMoreMenu
					menuId={ menu.id }
					menuTitle={ decodeEntities( menu.title?.rendered ?? '' ) }
					onDelete={ () => handleDelete( menu ) }
					onSave={ ( edits: unknown ) => handleSave( menu, edits ) }
					onDuplicate={ () => handleDuplicate( menu ) }
				/>
			}
		>
			<div style={ STYLES.items }>
				<NavigationMenuEditor navigationMenuId={ menu.id } />
			</div>
		</Page>
	);
}
