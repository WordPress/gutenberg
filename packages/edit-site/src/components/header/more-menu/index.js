/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FeatureToggle from '../feature-toggle';
import { moreVertical } from '@wordpress/icons';

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
		{ () => (
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
					messageDeactivated={ __( 'Spotlight mode deactivated' ) }
				/>
				<FeatureToggle
					feature="fullscreenMode"
					label={ __( 'Fullscreen mode' ) }
					info={ __( 'Work without distraction' ) }
					messageActivated={ __( 'Fullscreen mode activated' ) }
					messageDeactivated={ __( 'Fullscreen mode deactivated' ) }
				/>
			</MenuGroup>
		) }
	</DropdownMenu>
);

export default MoreMenu;
