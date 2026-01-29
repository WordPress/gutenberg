/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import Button from '../button';
import Dropdown from '../dropdown';
import type { DropdownLinkActionProps } from './types';
import type { WordPressComponentProps } from '../context';
import type { ButtonAsButtonProps } from '../button/types';

export function DropdownLinkAction( {
	buttonProps,
	className,
	dropdownProps,
	linkText,
}: DropdownLinkActionProps ) {
	return (
		<Dropdown
			className={ clsx(
				'components-circular-option-picker__dropdown-link-action',
				className
			) }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					variant="link"
					{ ...buttonProps }
				>
					{ linkText }
				</Button>
			) }
			{ ...dropdownProps }
		/>
	);
}

export function ButtonAction( {
	className,
	children,
	...additionalProps
}: WordPressComponentProps< ButtonAsButtonProps, 'button', false > ) {
	return (
		<Button
			__next40pxDefaultSize
			className={ clsx(
				'components-circular-option-picker__clear',
				className
			) }
			variant="tertiary"
			{ ...additionalProps }
		>
			{ children }
		</Button>
	);
}
