/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

const POPOVER_PROPS = {
	className: 'interface-more-menu__content',
	position: 'bottom left',
};

const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

export default function MoreMenuDropdown( {
	/* translators: button label text should, if possible, be under 16 characters. */
	label = __( 'Options' ),
	popoverProps,
	toggleProps,
	children,
} ) {
	return (
		<DropdownMenu
			className="interface-more-menu-dropdown"
			icon={ moreVertical }
			label={ label }
			popoverProps={ {
				...POPOVER_PROPS,
				...popoverProps,
			} }
			toggleProps={ {
				...TOGGLE_PROPS,
				...toggleProps,
			} }
		>
			{ ( onClose ) => children( onClose ) }
		</DropdownMenu>
	);
}
