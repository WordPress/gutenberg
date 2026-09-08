import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Button } from '../button';
import { Icon } from '../icon';
import * as Tooltip from '../tooltip';
import {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
	useKeyboardShortcutProps,
} from '../utils/keyboard-shortcut';
import styles from './style.module.css';
import { type IconButtonProps } from './types';

/**
 * An icon-only button with automatic tooltip and optimized styling.
 * Inherits all Button props while providing icon-specific enhancements.
 *
 * When rendering a group of `IconButton`s, wrap them in a `Tooltip.Provider`
 * to coordinate tooltip delays across the group.
 *
 * See the [Usage Guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs)
 * for when to use `Button`, `IconButton`, `Link`, or `LinkButton`.
 */
export const IconButton = forwardRef< HTMLButtonElement, IconButtonProps >(
	function IconButton(
		{
			label,
			className,
			// Prevent accidental forwarding of `children`
			children: _children,
			disabled,
			focusableWhenDisabled = true,
			icon,
			size,
			shortcut,
			positioner,
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			...restProps
		}: IconButtonProps & { children?: unknown },
		ref
	) {
		const classes = clsx( styles[ 'icon-button' ], className );
		const { descriptionId, targetProps } = useKeyboardShortcutProps( {
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			shortcut,
		} );

		return (
			<Tooltip.Root>
				<Tooltip.Trigger
					ref={ ref }
					{ ...targetProps }
					disabled={ disabled && ! focusableWhenDisabled }
					render={
						<Button
							{ ...restProps }
							size={ size }
							aria-label={ label }
							disabled={ disabled }
							focusableWhenDisabled={ focusableWhenDisabled }
						/>
					}
					className={ classes }
				>
					<Icon icon={ icon } size={ 24 } className={ styles.icon } />
					{ shortcut && descriptionId && (
						<KeyboardShortcutDescription
							descriptionId={ descriptionId }
							shortcut={ shortcut }
						/>
					) }
				</Tooltip.Trigger>
				<Tooltip.Popup positioner={ positioner }>
					{ label }
					{ shortcut && (
						<>
							{ ' ' }
							<KeyboardShortcutDisplay shortcut={ shortcut } />
						</>
					) }
				</Tooltip.Popup>
			</Tooltip.Root>
		);
	}
);
