/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { header, footer, layout } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
} from '../sidebar-navigation-screen-details-panel';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import ScreenNavigationMoreMenu from './more-menu';
import NavigationMenuEditor from './navigation-menu-editor';
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';
import EditButton from './edit-button';
import { useLink } from '../routes/link';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

function TemplateAreaButton( { postId, icon, title } ) {
	const icons = {
		header,
		footer,
	};
	const linkInfo = useLink( {
		postType: TEMPLATE_PART_POST_TYPE,
		postId,
	} );

	return (
		<SidebarNavigationItem
			className="edit-site-sidebar-navigation-screen-template__template-area-button"
			{ ...linkInfo }
			icon={ icons[ icon ] ?? layout }
			withChevron
		>
			<Truncate
				limit={ 20 }
				ellipsizeMode="tail"
				numberOfLines={ 1 }
				className="edit-site-sidebar-navigation-screen-template__template-area-label-text"
			>
				{ decodeEntities( title ) }
			</Truncate>
		</SidebarNavigationItem>
	);
}

export default function SingleNavigationMenu( {
	navigationMenu,
	handleDelete,
	handleDuplicate,
	handleSave,
} ) {
	const menuTitle = navigationMenu?.title?.rendered;

	const templatePartsIds = navigationMenu?.template_parts_that_use_menu ?? [];

	const templateParts = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'postType',
				TEMPLATE_PART_POST_TYPE
			),
		[]
	);

	const templatePartsData =
		templateParts?.filter( ( templatePart ) =>
			templatePartsIds.includes( templatePart.wp_id )
		) ?? [];

	return (
		<SidebarNavigationScreenWrapper
			actions={
				<>
					<ScreenNavigationMoreMenu
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ handleDelete }
						onSave={ handleSave }
						onDuplicate={ handleDuplicate }
					/>
					<EditButton postId={ navigationMenu?.id } />
				</>
			}
			title={ buildNavigationLabel(
				navigationMenu?.title,
				navigationMenu?.id,
				navigationMenu?.status
			) }
			description={ __(
				'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
			) }
		>
			<NavigationMenuEditor navigationMenuId={ navigationMenu?.id } />

			{ templatePartsData.length > 0 && (
				<SidebarNavigationScreenDetailsPanel
					title={ __( 'This menu is used in' ) }
					spacing={ 3 }
				>
					<ItemGroup>
						{ templatePartsData.map(
							( { wp_id: wpId, theme, slug, title } ) => (
								<SidebarNavigationScreenDetailsPanelRow
									key={ wpId }
								>
									<TemplateAreaButton
										postId={ `${ theme }//${ slug }` }
										title={ title?.rendered }
										icon={ slug }
									/>
								</SidebarNavigationScreenDetailsPanelRow>
							)
						) }
					</ItemGroup>
				</SidebarNavigationScreenDetailsPanel>
			) }
		</SidebarNavigationScreenWrapper>
	);
}
