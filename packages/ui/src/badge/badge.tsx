import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { info } from '@wordpress/icons';
import { type BadgeProps } from './types';
import styles from './style.module.css';
import { Text } from '../text';
import { Icon } from '../icon';
import * as Popover from '../popover';
import focusStyles from '../utils/css/focus.module.scss';
import defenseStyles from '../utils/css/global-css-defense.module.css';

/**
 * A badge component for displaying labels with semantic intent.
 * Add an infotip to explain a status in a popover.
 */
export const Badge = forwardRef< HTMLSpanElement, BadgeProps >(
	function UnforwardedBadge(
		{ intent = 'none', className, children, infotip, render, ...props },
		ref
	) {
		const badge = (
			<Text
				ref={ ref }
				className={ clsx(
					styles.badge,
					styles[ `is-${ intent }-intent` ],
					infotip && [
						styles[ 'infotip-trigger' ],
						defenseStyles.button,
						focusStyles[ 'outset-ring--focus-except-active' ],
					],
					className
				) }
				{ ...props }
				render={
					infotip ? (
						<Popover.Trigger
							openOnHover
							delay={ 200 }
							closeDelay={ 200 }
							render={ render }
						/>
					) : (
						render
					)
				}
				variant="body-sm"
			>
				{ children }
				{ infotip && (
					<Icon
						icon={ info }
						size={ 16 }
						aria-hidden="true"
						className={ styles[ 'infotip-icon' ] }
					/>
				) }
			</Text>
		);

		return infotip ? (
			<Popover.Root>
				{ badge }
				{ infotip }
			</Popover.Root>
		) : (
			badge
		);
	}
);
