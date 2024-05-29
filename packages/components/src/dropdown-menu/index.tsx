/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { menu } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { contextConnectWithoutRef, useContextSystem } from '../context';
import Button from '../button';
import Dropdown from '../dropdown';
import { NavigableMenu } from '../navigable-container';
import type {
	DropdownMenuProps,
	DropdownOption,
	DropdownMenuInternalContext,
} from './types';

function mergeProps<
	T extends { className?: string; [ key: string ]: unknown },
>( defaultProps: Partial< T > = {}, props: T = {} as T ) {
	const mergedProps: T = {
		...defaultProps,
		...props,
	};

	if ( props.className && defaultProps.className ) {
		mergedProps.className = clsx( props.className, defaultProps.className );
	}

	return mergedProps;
}

function isFunction( maybeFunc: unknown ): maybeFunc is () => void {
	return typeof maybeFunc === 'function';
}

function UnconnectedDropdownMenu( dropdownMenuProps: DropdownMenuProps ) {
	const {
		children,
		className,
		controls,
		icon = menu,
		label,
		popoverProps,
		toggleProps,
		menuProps,
		disableOpenOnArrowDown = false,
		text,
		noIcons,

		open,
		defaultOpen,
		onToggle: onToggleProp,

		// Context
		variant,
	} = useContextSystem< DropdownMenuProps & DropdownMenuInternalContext >(
		dropdownMenuProps,
		'DropdownMenu'
	);

	if ( ! controls?.length && ! isFunction( children ) ) {
		return null;
	}

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets: DropdownOption[][];
	if ( controls?.length ) {
		// @ts-expect-error The check below is needed because `DropdownMenus`
		// rendered by `ToolBarGroup` receive controls as a nested array.
		controlSets = controls;
		if ( ! Array.isArray( controlSets[ 0 ] ) ) {
			// This is not ideal, but at this point we know that `controls` is
			// not a nested array, even if TypeScript doesn't.
			controlSets = [ controls as DropdownOption[] ];
		}
	}

	const mergedPopoverProps = mergeProps(
		{
			className: 'components-dropdown-menu__popover',
			variant,
		},
		popoverProps
	);

	return (
		<Dropdown
			className={ className }
			popoverProps={ mergedPopoverProps }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const openOnArrowDown = ( event: React.KeyboardEvent ) => {
					if ( disableOpenOnArrowDown ) {
						return;
					}

					if ( ! isOpen && event.code === 'ArrowDown' ) {
						event.preventDefault();
						onToggle();
					}
				};
				const { as: Toggle = Button, ...restToggleProps } =
					toggleProps ?? {};

				const mergedToggleProps = mergeProps(
					{
						className: clsx( 'components-dropdown-menu__toggle', {
							'is-opened': isOpen,
						} ),
					},
					restToggleProps
				);

				return (
					<Toggle
						{ ...mergedToggleProps }
						icon={ icon }
						onClick={
							( ( event ) => {
								onToggle();
								if ( mergedToggleProps.onClick ) {
									mergedToggleProps.onClick( event );
								}
							} ) as React.MouseEventHandler< HTMLButtonElement >
						}
						onKeyDown={
							( ( event ) => {
								openOnArrowDown( event );
								if ( mergedToggleProps.onKeyDown ) {
									mergedToggleProps.onKeyDown( event );
								}
							} ) as React.KeyboardEventHandler< HTMLButtonElement >
						}
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						text={ text }
						showTooltip={ toggleProps?.showTooltip ?? true }
					>
						{ mergedToggleProps.children }
					</Toggle>
				);
			} }
			renderContent={ ( props ) => {
				const mergedMenuProps = mergeProps(
					{
						'aria-label': label,
						className: clsx( 'components-dropdown-menu__menu', {
							'no-icons': noIcons,
						} ),
					},
					menuProps
				);

				return (
					<NavigableMenu { ...mergedMenuProps } role="menu">
						{ isFunction( children ) ? children( props ) : null }
						{ controlSets?.flatMap( ( controlSet, indexOfSet ) =>
							controlSet.map( ( control, indexOfControl ) => (
								<Button
									key={ [
										indexOfSet,
										indexOfControl,
									].join() }
									onClick={ ( event ) => {
										event.stopPropagation();
										props.onClose();
										if ( control.onClick ) {
											control.onClick();
										}
									} }
									className={ clsx(
										'components-dropdown-menu__menu-item',
										{
											'has-separator':
												indexOfSet > 0 &&
												indexOfControl === 0,
											'is-active': control.isActive,
											'is-icon-only': ! control.title,
										}
									) }
									icon={ control.icon }
									label={ control.label }
									aria-checked={
										control.role === 'menuitemcheckbox' ||
										control.role === 'menuitemradio'
											? control.isActive
											: undefined
									}
									role={
										control.role === 'menuitemcheckbox' ||
										control.role === 'menuitemradio'
											? control.role
											: 'menuitem'
									}
									disabled={ control.isDisabled }
								>
									{ control.title }
								</Button>
							) )
						) }
					</NavigableMenu>
				);
			} }
			open={ open }
			defaultOpen={ defaultOpen }
			onToggle={ onToggleProp }
		/>
	);
}

/**
 *
 * The DropdownMenu displays a list of actions (each contained in a MenuItem,
 * MenuItemsChoice, or MenuGroup) in a compact way. It appears in a Popover
 * after the user has interacted with an element (a button or icon) or when
 * they perform a specific action.
 *
 * Render a Dropdown Menu with a set of controls:
 *
 * ```jsx
 * import { DropdownMenu } from '@wordpress/components';
 * import {
 * 	more,
 * 	arrowLeft,
 * 	arrowRight,
 * 	arrowUp,
 * 	arrowDown,
 * } from '@wordpress/icons';
 *
 * const MyDropdownMenu = () => (
 * 	<DropdownMenu
 * 		icon={ more }
 * 		label="Select a direction"
 * 		controls={ [
 * 			{
 * 				title: 'Up',
 * 				icon: arrowUp,
 * 				onClick: () => console.log( 'up' ),
 * 			},
 * 			{
 * 				title: 'Right',
 * 				icon: arrowRight,
 * 				onClick: () => console.log( 'right' ),
 * 			},
 * 			{
 * 				title: 'Down',
 * 				icon: arrowDown,
 * 				onClick: () => console.log( 'down' ),
 * 			},
 * 			{
 * 				title: 'Left',
 * 				icon: arrowLeft,
 * 				onClick: () => console.log( 'left' ),
 * 			},
 * 		] }
 * 	/>
 * );
 * ```
 *
 * Alternatively, specify a `children` function which returns elements valid for
 * use in a DropdownMenu: `MenuItem`, `MenuItemsChoice`, or `MenuGroup`.
 *
 * ```jsx
 * import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
 * import { more, arrowUp, arrowDown, trash } from '@wordpress/icons';
 *
 * const MyDropdownMenu = () => (
 * 	<DropdownMenu icon={ more } label="Select a direction">
 * 		{ ( { onClose } ) => (
 * 			<>
 * 				<MenuGroup>
 * 					<MenuItem icon={ arrowUp } onClick={ onClose }>
 * 						Move Up
 * 					</MenuItem>
 * 					<MenuItem icon={ arrowDown } onClick={ onClose }>
 * 						Move Down
 * 					</MenuItem>
 * 				</MenuGroup>
 * 				<MenuGroup>
 * 					<MenuItem icon={ trash } onClick={ onClose }>
 * 						Remove
 * 					</MenuItem>
 * 				</MenuGroup>
 * 			</>
 * 		) }
 * 	</DropdownMenu>
 * );
 * ```
 *
 */
export const DropdownMenu = contextConnectWithoutRef(
	UnconnectedDropdownMenu,
	'DropdownMenu'
);

export default DropdownMenu;
