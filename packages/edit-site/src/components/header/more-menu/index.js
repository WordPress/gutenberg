/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';
import {
	ActionItem,
	MoreMenuDropdown,
	MoreMenuFeatureToggle,
} from '@wordpress/interface';

/**
 * Internal dependencies
 */
import ToolsMoreMenuGroup from '../tools-more-menu-group';

const POPOVER_PROPS = {
	className: 'edit-site-more-menu__content',
};

const MoreMenu = () => (
	<MoreMenuDropdown
		className="edit-site-more-menu"
		popoverProps={ POPOVER_PROPS }
	>
		{ ( { onClose } ) => (
			<>
				<MenuGroup label={ _x( 'View', 'noun' ) }>
					<MoreMenuFeatureToggle
						scope="core/edit-site"
						feature="fixedToolbar"
						label={ __( 'Top toolbar' ) }
						info={ __(
							'Access all block and document tools in a single place'
						) }
						messageActivated={ __( 'Top toolbar activated' ) }
						messageDeactivated={ __( 'Top toolbar deactivated' ) }
					/>
					<MoreMenuFeatureToggle
						scope="core/edit-site"
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
	</MoreMenuDropdown>
);

export default MoreMenu;
