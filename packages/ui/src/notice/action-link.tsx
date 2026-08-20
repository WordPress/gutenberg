import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Link } from '../link';
import { Text } from '../text';
import type { ActionLinkProps } from './types';
import styles from './style.module.css';

/**
 * An action link for use within Notice.Actions.
 */
export const ActionLink = forwardRef< HTMLAnchorElement, ActionLinkProps >(
	function NoticeActionLink( { className, render, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				className={ clsx( styles[ 'action-link' ], className ) }
				{ ...props }
				variant="body-md"
				render={
					<Link tone="neutral" variant="default" render={ render } />
				}
			/>
		);
	}
);
