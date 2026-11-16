import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { help } from '@wordpress/icons';
import { type BadgeProps } from './types';
import styles from './style.module.scss';
import { Text } from '../text';
import { Icon } from '../icon';
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
					className
				) }
				{ ...props }
				render={
					infotip ? (
						<infotip.popover.Trigger
							className={ clsx(
								styles[ 'infotip-trigger' ],
								defenseStyles.button
							) }
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
						icon={ help }
						size={ 16 }
						aria-hidden="true"
						className={ styles[ 'infotip-icon' ] }
					/>
				) }
			</Text>
		);

		return infotip ? (
			<infotip.popover.Root>
				{ badge }
				{ infotip.popup }
			</infotip.popover.Root>
		) : (
			badge
		);
	}
);
