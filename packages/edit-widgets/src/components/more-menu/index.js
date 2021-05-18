/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FeatureToggle from './feature-toggle';
import { store as editWidgetsStore } from '../../store';

const POPOVER_PROPS = {
	className: 'edit-widgets-more-menu__content',
	position: 'bottom left',
};
const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

export default function MoreMenu() {
	const showIconLabels = useSelect(
		( select ) =>
			select( editWidgetsStore ).__unstableIsFeatureActive(
				'showIconLabels'
			),
		[]
	);

	return (
		<>
			<DropdownMenu
				className="edit-widgets-more-menu"
				icon={ moreVertical }
				/* translators: button label text should, if possible, be under 16 characters. */
				label={ __( 'Options' ) }
				popoverProps={ POPOVER_PROPS }
				toggleProps={ {
					showTooltip: ! showIconLabels,
					isTertiary: showIconLabels,
					...TOGGLE_PROPS,
				} }
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
							messageDeactivated={ __(
								'Top toolbar deactivated'
							) }
						/>
					</MenuGroup>
				) }
			</DropdownMenu>
		</>
	);
}
