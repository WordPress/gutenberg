import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Button } from '../button';
import { Icon } from '../icon';
import * as Tooltip from '../tooltip';
import styles from './style.module.css';
import { type IconButtonProps } from './types';

/**
 * An icon-only button with automatic tooltip and optimized styling.
 * Inherits all Button props while providing icon-specific enhancements.
 */
export const IconButton = forwardRef< HTMLButtonElement, IconButtonProps >(
	function IconButton(
		{
			label,
			className,
			// Prevent accidental forwarding of `children`
			children: _children,
			icon,
			size,
			shortcut,
			...restProps
		}: IconButtonProps & { children?: unknown },
		ref
	) {
		const classes = clsx( styles[ 'icon-button' ], className );

		return (
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root>
					<Tooltip.Trigger
						ref={ ref }
						render={
							<Button
								{ ...restProps }
								size={ size }
								aria-label={ label }
								aria-keyshortcuts={ shortcut?.ariaKeyShortcut }
							/>
						}
						className={ classes }
					>
						<Icon
							icon={ icon }
							size={ 24 }
							className={ styles.icon }
						/>
					</Tooltip.Trigger>
					<Tooltip.Popup>
						{ label }
						{ shortcut && (
							<>
								{ ' ' }
								<span aria-hidden="true">
									{ shortcut.displayShortcut }
								</span>
							</>
						) }
					</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);
	}
);
