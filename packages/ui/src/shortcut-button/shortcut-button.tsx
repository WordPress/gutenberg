import { forwardRef } from '@wordpress/element';
import { Button } from '../button';
import * as Tooltip from '../tooltip';
import {
	KeyboardShortcutDescription,
	KeyboardShortcutDisplay,
	useKeyboardShortcutProps,
} from '../utils/keyboard-shortcut';
import type { ShortcutButtonProps } from './types';

/**
 * A button that displays its keyboard shortcut in a tooltip and uses its
 * shortcut label in an accessible description.
 *
 * This component does not register or handle the keyboard shortcut. Consumers
 * are responsible for implementing the shortcut and keeping its handler
 * synchronized with the button's disabled state.
 *
 * When rendering a group of `ShortcutButton`s, wrap them in a
 * `Tooltip.Provider` to coordinate tooltip delays across the group.
 *
 * See the [Usage Guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs)
 * for when to use `Button`, `ShortcutButton`, `IconButton`, `Link`, or
 * `LinkButton`.
 */
export const ShortcutButton = forwardRef<
	HTMLButtonElement,
	ShortcutButtonProps
>( function ShortcutButton(
	{
		children,
		disabled,
		focusableWhenDisabled = true,
		loading,
		positioner,
		shortcut,
		'aria-describedby': ariaDescribedBy,
		...restProps
	},
	ref
) {
	const { descriptionId, targetProps } = useKeyboardShortcutProps( {
		'aria-describedby': ariaDescribedBy,
		shortcut,
	} );
	const isDisabled = disabled ?? loading;

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				ref={ ref }
				{ ...targetProps }
				disabled={ isDisabled && ! focusableWhenDisabled }
				render={
					<Button
						{ ...restProps }
						disabled={ disabled }
						focusableWhenDisabled={ focusableWhenDisabled }
						loading={ loading }
					/>
				}
			>
				{ children }
				{ descriptionId && (
					<KeyboardShortcutDescription
						descriptionId={ descriptionId }
						shortcut={ shortcut }
					/>
				) }
			</Tooltip.Trigger>
			<Tooltip.Popup positioner={ positioner }>
				{ children } <KeyboardShortcutDisplay shortcut={ shortcut } />
			</Tooltip.Popup>
		</Tooltip.Root>
	);
} );
