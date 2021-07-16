/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { ActionItem } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import FeatureToggle from '../feature-toggle';
import ToolsMoreMenuGroup from '../tools-more-menu-group';

const POPOVER_PROPS = {
	className: 'edit-site-more-menu__content',
	position: 'bottom left',
};
const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

const MoreMenu = () => (
	<DropdownMenu
		className="edit-site-more-menu"
		icon={ moreVertical }
		label={ __( 'More tools & options' ) }
		popoverProps={ POPOVER_PROPS }
		toggleProps={ TOGGLE_PROPS }
	>
		{ ( { onClose } ) => (
			<>
				<MenuGroup label={ _x( 'View', 'noun' ) }>
					<FeatureToggle
						feature="fixedToolbar"
						label={ __( 'Top toolbar' ) }
						info={ __(
							'Access all block and document tools in a single place'
						) }
						messageActivated={ __( 'Top toolbar activated' ) }
						messageDeactivated={ __( 'Top toolbar deactivated' ) }
					/>
					<FeatureToggle
						feature="focusMode"
						label={ __( 'Spotlight mode' ) }
						info={ __( 'Focus on one block at a time' ) }
						messageActivated={ __( 'Spotlight mode activated' ) }
						messageDeactivated={ __(
							'Spotlight mode deactivated'
						) }
					/>
					<ActionItem.Slot
						name="core/edit-site/plugin-more-menu"
						label={ __( 'Plugins' ) }
						as={ MenuGroup }
						fillProps={ { onClick: onClose } }
					/>
				</MenuGroup>
				<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
			</>
		) }
	</DropdownMenu>
);

export default MoreMenu;
