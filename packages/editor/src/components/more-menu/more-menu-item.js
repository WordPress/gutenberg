import { forwardRef } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, Menu } from '@wordpress/ui';

function UnforwardedMoreMenuItem(
	{
		'aria-checked': ariaChecked,
		children,
		icon,
		info,
		onClick,
		role,
		target,
		...props
	},
	ref
) {
	const label = <Menu.ItemLabel>{ children }</Menu.ItemLabel>;
	const description = info ? (
		<Menu.ItemDescription>{ info }</Menu.ItemDescription>
	) : null;
	const prefix = icon ? <Icon icon={ icon } /> : undefined;

	// Items toggling a sidebar of the plugins API describe themselves with the
	// ARIA props of a checkable item.
	if ( role === 'menuitemcheckbox' ) {
		return (
			<Menu.CheckboxItem
				ref={ ref }
				checked={ !! ariaChecked }
				closeOnClick
				onCheckedChange={ () => onClick() }
				prefix={ prefix }
				{ ...props }
			>
				{ label }
				{ description }
			</Menu.CheckboxItem>
		);
	}

	if ( props.href ) {
		return (
			<Menu.LinkItem
				ref={ ref }
				prefix={ prefix }
				openInNewTab={ target === '_blank' }
				onClick={ onClick }
				{ ...props }
			>
				{ label }
				{ description }
			</Menu.LinkItem>
		);
	}

	return (
		<Menu.Item
			ref={ ref }
			prefix={ prefix }
			onClick={ onClick }
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
