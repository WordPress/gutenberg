/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { ActionItem, PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ModeSwitcher from '../mode-switcher';
import PreferencesMenuItem from '../preferences-menu-item';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import WritingMenu from '../writing-menu';

const POPOVER_PROPS = {
	className: 'edit-post-more-menu__content',
	position: 'bottom left',
};
const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

const MoreMenu = ( { showIconLabels } ) => {
	const isLargeViewport = useViewportMatch( 'large' );

	return (
		<DropdownMenu
			className="edit-post-more-menu"
			icon={ moreVertical }
			/* translators: button label text should, if possible, be under 16 characters. */
			label={ __( 'Options' ) }
			popoverProps={ POPOVER_PROPS }
			toggleProps={ {
				showTooltip: ! showIconLabels,
				...( showIconLabels && { variant: 'tertiary' } ),
				...TOGGLE_PROPS,
			} }
		>
			{ ( { onClose } ) => (
				<>
					{ showIconLabels && ! isLargeViewport && (
						<PinnedItems.Slot
							className={ showIconLabels && 'show-icon-labels' }
							scope="core/edit-post"
						/>
					) }
					<WritingMenu />
					<ModeSwitcher />
					<ActionItem.Slot
						name="core/edit-post/plugin-more-menu"
						label={ __( 'Plugins' ) }
						as={ MenuGroup }
						fillProps={ { onClick: onClose } }
					/>
					<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
					<MenuGroup>
						<PreferencesMenuItem />
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
};

export default MoreMenu;
