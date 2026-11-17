import type { ComponentProps, ForwardedRef } from 'react';
import type { Button, DistributiveOmit } from '@wordpress/components';

type ToggleButtonProps = DistributiveOmit<
	ComponentProps< typeof Button >,
	'ref' | 'onToggle'
>;

/**
 * Props of `BlockNavigationDropdown`. Other props go to the toggle button.
 */
export type BlockNavigationDropdownProps = ToggleButtonProps & {
	isDisabled?: boolean;
};

export type BlockNavigationDropdownToggleProps = ToggleButtonProps & {
	isEnabled: boolean;
	onToggle: () => void;
	isOpen: boolean;
	innerRef: ForwardedRef< HTMLButtonElement >;
};
