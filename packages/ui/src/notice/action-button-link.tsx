import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { ButtonLink } from '../button-link';
import type { ActionButtonLinkProps } from './types';
import styles from './style.module.css';

/**
 * An action link with button styling for use within Notice.Actions.
 */
export const ActionButtonLink = forwardRef<
	HTMLAnchorElement,
	ActionButtonLinkProps
>( function NoticeActionButtonLink( { className, variant, ...props }, ref ) {
	return (
		<ButtonLink
			{ ...props }
			ref={ ref }
			size="compact"
			tone="neutral"
			variant={ variant }
			className={ clsx( styles[ 'action-button' ], className ) }
		/>
	);
} );
