/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';
import {
	MoreMenuDropdown,
	ActionItem,
	PinnedItems,
} from '@wordpress/interface';
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
};

const MoreMenu = ( { showIconLabels } ) => {
	const isLargeViewport = useViewportMatch( 'large' );

	return (
		<MoreMenuDropdown
			className="edit-post-more-menu"
			popoverProps={ POPOVER_PROPS }
			toggleProps={ {
				showTooltip: ! showIconLabels,
				...( showIconLabels && { variant: 'tertiary' } ),
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
		</MoreMenuDropdown>
	);
};

export default MoreMenu;
