/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

export default function MoreMenuDropdown( {
	className,
	/* translators: button label text should, if possible, be under 16 characters. */
	label = __( 'Options' ),
	popoverProps,
	toggleProps,
	children,
} ) {
	return (
		<DropdownMenu
			className={ classnames(
				'interface-more-menu-dropdown',
				className
			) }
			icon={ moreVertical }
			label={ label }
			popoverProps={ {
				position: 'bottom left',
				...popoverProps,
				className: classnames(
					'interface-more-menu-dropdown__content',
					popoverProps?.className
				),
			} }
			toggleProps={ {
				tooltipPosition: 'bottom',
				...toggleProps,
			} }
		>
			{ ( onClose ) => children( onClose ) }
		</DropdownMenu>
	);
}
