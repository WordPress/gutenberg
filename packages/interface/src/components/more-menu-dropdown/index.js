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
	as: DropdownComponent = DropdownMenu,
	className,
	/* translators: button label text should, if possible, be under 16 characters. */
	label = __( 'Options' ),
	popoverProps,
	toggleProps,
	children,
} ) {
	return (
		<DropdownComponent
			className={ classnames(
				'interface-more-menu-dropdown',
				className
			) }
			icon={ moreVertical }
			label={ label }
			popoverProps={ {
				placement: 'bottom-end',
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
		</DropdownComponent>
	);
}
