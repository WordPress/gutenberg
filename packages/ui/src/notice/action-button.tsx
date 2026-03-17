import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Button } from '../button';
import type { ActionButtonProps } from './types';
import styles from './style.module.css';

/**
 * An action button for use within Notice.Actions.
 */
export const ActionButton = forwardRef< HTMLButtonElement, ActionButtonProps >(
	function NoticeActionButton(
		{ className, loading, loadingAnnouncement, variant, ...props },
		ref
	) {
		const loadingProps =
			loading !== undefined
				? { loading, loadingAnnouncement: loadingAnnouncement ?? '' }
				: {};

		return (
			<Button
				{ ...props }
				{ ...loadingProps }
				ref={ ref }
				size="compact"
				tone="neutral"
				variant={ variant }
				className={ clsx(
					styles[ 'action-button' ],
					styles[ `is-action-button-${ variant }` ],
					className
				) }
			/>
		);
	}
);
