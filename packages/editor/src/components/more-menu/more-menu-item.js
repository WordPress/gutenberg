import { Icon as WCIcon } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';

/**
 * Converts the shortcut shapes the legacy `MenuItem` took, a string or an
 * object of `display` and `ariaLabel`, to the one the menu takes.
 *
 * `ariaKeyShortcut` is left out: it cannot be derived from display text, and
 * the legacy item never set `aria-keyshortcuts` either.
 *
 * @param {string|Object} [shortcut] Shortcut in any accepted shape.
 *
 * @return {?Object} Shortcut of a menu item.
 */
function adaptShortcut( shortcut ) {
	if ( ! shortcut ) {
		return undefined;
	}

	if ( typeof shortcut === 'string' ) {
		return { displayShortcut: shortcut, label: shortcut };
	}

	if ( shortcut.displayShortcut ) {
		return shortcut;
	}

	return {
		displayShortcut: shortcut.display,
		label: shortcut.ariaLabel ?? shortcut.display,
	};
}

function UnforwardedMoreMenuItem(
	{
		'aria-checked': ariaChecked,
		children,
		href,
		icon,
		info,
		isSelected,
		onClick,
		role,
		shortcut,
		target,
		...props
	},
	ref
) {
	const label = <Menu.ItemLabel>{ children }</Menu.ItemLabel>;
	const description = info ? (
		<Menu.ItemDescription>{ info }</Menu.ItemDescription>
	) : null;
	// Not the UI package's icon: only this one renders the Dashicon slugs
	// `PluginMoreMenuItem` accepts.
	const prefix = icon ? <WCIcon icon={ icon } /> : undefined;
	const itemShortcut = adaptShortcut( shortcut );
	// `MenuItem` documented `isSelected`; `ComplementaryAreaToggle` sets
	// `aria-checked`.
	const checked =
		isSelected ?? ( ariaChecked === true || ariaChecked === 'true' );

	if ( role === 'menuitemcheckbox' ) {
		return (
			<Menu.CheckboxItem
				ref={ ref }
				checked={ checked }
				closeOnClick
				onCheckedChange={ () => onClick?.() }
				prefix={ prefix }
				shortcut={ itemShortcut }
				{ ...props }
			>
				{ label }
				{ description }
			</Menu.CheckboxItem>
		);
	}

	if ( href !== undefined ) {
		return (
			<Menu.LinkItem
				ref={ ref }
				href={ href }
				prefix={ prefix }
				shortcut={ itemShortcut }
				openInNewTab={ target === '_blank' }
				onClick={ onClick }
				{ ...props }
			>
				{ label }
				{ description }
			</Menu.LinkItem>
		);
	}

	// `Menu.RadioItem` only works inside a `Menu.RadioGroup`, which a fill
	// cannot join, so pass the role and state on instead.
	const radioProps =
		role === 'menuitemradio' ? { role, 'aria-checked': checked } : {};

	return (
		<Menu.Item
			ref={ ref }
			prefix={ prefix }
			shortcut={ itemShortcut }
			onClick={ onClick }
			{ ...radioProps }
			{ ...props }
		>
			{ label }
			{ description }
		</Menu.Item>
	);
}

/**
 * Renders an item of the more menu. Fills use it instead of the menu parts,
 * which only share their context within the package they are bundled into.
 */
export default forwardRef( UnforwardedMoreMenuItem );
