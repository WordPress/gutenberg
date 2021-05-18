/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

const POPOVER_PROPS = {
	className: 'edit-widgets-more-menu__content',
	position: 'bottom left',
};
const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

export default function MoreMenu( { showIconLabels } ) {
	return (
		<DropdownMenu
			className="edit-post-more-menu"
			icon={ moreVertical }
			/* translators: button label text should, if possible, be under 16 characters. */
			label={ __( 'Options' ) }
			popoverProps={ POPOVER_PROPS }
			toggleProps={ {
				showTooltip: ! showIconLabels,
				isTertiary: showIconLabels,
				...TOGGLE_PROPS,
			} }
		></DropdownMenu>
	);
}
