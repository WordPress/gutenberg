import { Icon as WCIcon } from '@wordpress/components';
import { forwardRef, isValidElement } from '@wordpress/element';
import { SVG } from '@wordpress/primitives';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import type {
	ComponentProps,
	ForwardedRef,
	HTMLAttributes,
	MouseEvent,
	ReactNode,
} from 'react';

type MenuShortcut = NonNullable<
	ComponentProps< typeof Menu.Item >[ 'shortcut' ]
>;

/**
 * Shortcut in any of the shapes the legacy `MenuItem` took.
 */
type LegacyShortcut =
	| string
	| MenuShortcut
	| { display: string; ariaLabel?: string };

type MoreMenuItemProps = Omit<
	HTMLAttributes< HTMLElement >,
	'children' | 'onClick'
> & {
	/**
	 * Label of the item.
	 */
	children?: ReactNode;

	/**
	 * Whether the item is disabled.
	 */
	disabled?: boolean;

	/**
	 * Address the item navigates to, which turns it into a link.
	 */
	href?: string;

	/**
	 * Icon rendered before the label, as an element or a Dashicon slug.
	 */
	icon?: ComponentProps< typeof WCIcon >[ 'icon' ];

	/**
	 * Description rendered below the label.
	 */
	info?: ReactNode;

	/**
	 * Whether a checkable item is checked.
	 */
	isSelected?: boolean;

	/**
	 * Accessible name of the item.
	 *
	 * @deprecated Pass the label as `children`, or set an `aria-label`.
	 */
	label?: string;

	/**
	 * Callback invoked when the item is selected.
	 */
	onClick?: ( event?: MouseEvent< HTMLElement > ) => void;

	/**
	 * Keyboard shortcut of the item.
	 */
	shortcut?: LegacyShortcut;

	/**
	 * Target of a link item.
	 */
	target?: string;
};

/**
 * Converts the shortcut shapes the legacy `MenuItem` took, a string or an
 * object of `display` and `ariaLabel`, to the one the menu takes.
 *
 * `ariaKeyShortcut` is left out: it cannot be derived from display text, and
 * the legacy item never set `aria-keyshortcuts` either.
 *
 * @param shortcut Shortcut in any accepted shape.
 *
 * @return Shortcut of a menu item.
 */
function adaptShortcut( shortcut?: LegacyShortcut ) {
	if ( ! shortcut ) {
		return undefined;
	}

	if ( typeof shortcut === 'string' ) {
		return { displayShortcut: shortcut, label: shortcut } as MenuShortcut;
	}

	if ( 'displayShortcut' in shortcut ) {
		return shortcut;
	}

	return {
		displayShortcut: shortcut.display,
		label: shortcut.ariaLabel ?? shortcut.display,
	} as MenuShortcut;
}

function UnforwardedMoreMenuItem(
	{
		'aria-checked': ariaChecked,
		'aria-label': ariaLabel,
		children,
		disabled,
		href,
		icon,
		info,
		isSelected,
		label,
		onClick,
		role,
		shortcut,
		target,
		...props
	}: MoreMenuItemProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	// `label` named the legacy item. The menu's own `label` is typeahead text.
	const itemLabel = <Menu.ItemLabel>{ children ?? label }</Menu.ItemLabel>;
	const itemAriaLabel = ariaLabel ?? label;
	const description = info ? (
		<Menu.ItemDescription>{ info }</Menu.ItemDescription>
	) : null;
	let prefix: ReactNode;
	if ( icon ) {
		// Preserve support for Dashicon slugs and custom icon components.
		prefix =
			isValidElement< ComponentProps< 'svg' > >( icon ) &&
			( icon.type === 'svg' || icon.type === SVG ) ? (
				<Menu.PrefixIcon
					icon={ icon }
					className={ icon.props.className }
				/>
			) : (
				<WCIcon icon={ icon } />
			);
	}
	const itemShortcut = adaptShortcut( shortcut );
	// `MenuItem` documented `isSelected`; `ComplementaryAreaToggle` sets
	// `aria-checked`.
	const checked =
		isSelected ?? ( ariaChecked === true || ariaChecked === 'true' );
	const isMixed = isSelected === undefined && ariaChecked === 'mixed';

	if ( role === 'menuitemcheckbox' && ! isMixed ) {
		return (
			<Menu.CheckboxItem
				ref={ ref }
				aria-label={ itemAriaLabel }
				checked={ checked }
				closeOnClick
				disabled={ disabled }
				onClick={ onClick }
				prefix={ prefix }
				shortcut={ itemShortcut }
				{ ...props }
			>
				{ itemLabel }
				{ description }
			</Menu.CheckboxItem>
		);
	}

	// A link item has no disabled state: it would still render an active
	// anchor. A disabled one falls through to an inert `Menu.Item`, the way
	// `PostPreviewMenuItem` renders it.
	if ( href !== undefined && ! disabled ) {
		return (
			<Menu.LinkItem
				ref={ ref }
				aria-label={ itemAriaLabel }
				closeOnClick
				href={ href }
				prefix={ prefix }
				shortcut={ itemShortcut }
				target={ target }
				onClick={ onClick }
				{ ...props }
			>
				{ itemLabel }
				{ description }
			</Menu.LinkItem>
		);
	}

	// `Menu.RadioItem` only works inside a `Menu.RadioGroup`, which a fill
	// cannot join, and `Menu.CheckboxItem` has no mixed state. Both fall back
	// to a plain item carrying the role and the state itself.
	const checkableProps =
		role === 'menuitemradio' || role === 'menuitemcheckbox'
			? { role, 'aria-checked': isMixed ? ( 'mixed' as const ) : checked }
			: {};

	return (
		<Menu.Item
			ref={ ref }
			aria-label={ itemAriaLabel }
			disabled={ disabled }
			prefix={ prefix }
			shortcut={ itemShortcut }
			onClick={ onClick }
			{ ...checkableProps }
			{ ...props }
		>
			{ itemLabel }
			{ description }
		</Menu.Item>
	);
}

/**
 * Renders an item of the more menu. Fills use it instead of the menu parts,
 * which only share their context within the package they are bundled into.
 */
export default forwardRef( UnforwardedMoreMenuItem );
