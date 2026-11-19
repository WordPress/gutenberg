import type { ComponentProps, ReactNode } from 'react';
import type { Button } from '@wordpress/components';

/**
 * An action button of the popover header.
 */
export interface InspectorPopoverHeaderAction {
	label: string;
	icon?: ComponentProps< typeof Button >[ 'icon' ];
	onClick?: () => void;
}

/**
 * Props of `InspectorPopoverHeader`.
 */
export interface InspectorPopoverHeaderProps {
	title: ReactNode;
	help?: ReactNode;
	actions?: InspectorPopoverHeaderAction[];
	onClose?: () => void;
}
