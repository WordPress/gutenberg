/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { menu } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import Dropdown from '../dropdown';
import { NavigableMenu } from '../navigable-container';
import type { DropdownMenuProps } from './types';

function mergeProps<
	T extends { className?: string; [ key: string ]: unknown }
>( defaultProps: Partial< T > = {}, props: T = {} as T ) {
	const mergedProps: T = {
		...defaultProps,
		...props,
	};

	if ( props.className && defaultProps.className ) {
		mergedProps.className = classnames(
			props.className,
			defaultProps.className
		);
	}

	return mergedProps;
}

function isFunction( maybeFunc: unknown ): maybeFunc is () => void {
	return typeof maybeFunc === 'function';
}

function DropdownMenu( dropdownMenuProps: DropdownMenuProps ) {
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
	} = dropdownMenuProps;

	if ( ! controls?.length && ! isFunction( children ) ) {
		return null;
	}

	// Normalize controls to nested array of objects (sets of controls)
	let controlSets: NonNullable< typeof controls >[];
	if ( controls?.length ) {
		// @ts-expect-error The check below is needed because `DropdownMenus`
		// rendered by `ToolBarGroup` receive controls as a nested array.
		controlSets = controls;
		if ( ! Array.isArray( controlSets[ 0 ] ) ) {
			// This is not ideal but was introduced to avoid runtime changes,
			// see above comment.
			controlSets = [ controls as unknown as typeof controls ];
		}
	}

	const mergedPopoverProps = mergeProps(
		{
			className: 'components-dropdown-menu__popover',
		},
		popoverProps
	);

	return (
		<Dropdown
			className={ classnames( 'components-dropdown-menu', className ) }
			popoverProps={ mergedPopoverProps }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const openOnArrowDown = ( event ) => {
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
						className: classnames(
							'components-dropdown-menu__toggle',
							{
								'is-opened': isOpen,
							}
						),
					},
					restToggleProps
				);

				return (
					<Toggle
						{ ...mergedToggleProps }
						icon={ icon }
						onClick={ ( event ) => {
							onToggle( event );
							if ( mergedToggleProps.onClick ) {
								mergedToggleProps.onClick( event );
							}
						} }
						onKeyDown={ ( event ) => {
							openOnArrowDown( event );
							if ( mergedToggleProps.onKeyDown ) {
								mergedToggleProps.onKeyDown( event );
							}
						} }
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
						className: classnames(
							'components-dropdown-menu__menu',
							{ 'no-icons': noIcons }
						),
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
									className={ classnames(
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
		/>
	);
}

export default DropdownMenu;
