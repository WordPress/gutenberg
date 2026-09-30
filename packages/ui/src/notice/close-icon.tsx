import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import clsx from 'clsx';
import { IconButton } from '../icon-button';
import type { CloseIconProps } from './types';
import styles from './style.module.css';

/**
 * The close button for a notice. Renders an icon button with a close icon.
 */
export const CloseIcon = forwardRef< HTMLButtonElement, CloseIconProps >(
	function NoticeCloseIcon(
		{ className, icon = closeSmall, label = __( 'Dismiss' ), ...props },
		ref
	) {
		return (
			<IconButton
				{ ...props }
				ref={ ref }
				className={ clsx( styles[ 'close-icon' ], className ) }
				variant="minimal"
				size="small"
				tone="neutral"
				icon={ icon }
				label={ label }
			/>
		);
	}
);
