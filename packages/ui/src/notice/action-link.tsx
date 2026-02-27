import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Link } from '../link';
import type { ActionLinkProps } from './types';
import styles from './style.module.css';

/**
 * An action link for use within Notice.Actions.
 */
export const ActionLink = forwardRef< HTMLAnchorElement, ActionLinkProps >(
	function NoticeActionLink( { className, ...props }, ref ) {
		return (
			<Link
				ref={ ref }
				tone="neutral"
				className={ clsx( styles[ 'action-link' ], className ) }
				{ ...props }
			/>
		);
	}
);
