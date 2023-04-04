/**
 * External dependencies
 */
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, DividerHorizontalIcon } from '@radix-ui/react-icons';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as DropdownMenuStyled from './styles';
import type { DropdownMenuProps, DropdownSubMenuProps } from './types';

// Observations:
// - is it enough to have only one forwarded ref? If we have only one, should it be to the root, or to the content?
// - Should we be consistent in using the same value for the `asChild` prop on both trigger and content?
// - Should we allow customizing the `asChild` prop on trigger and content?
// - Should we explicitly Pick<> every prop ?
export const DropdownMenu = forwardRef(
	(
		{ children, rootProps, contentProps, trigger }: DropdownMenuProps,
		forwardedRef: React.ForwardedRef< any >
	) => {
		return (
			<DropdownMenuPrimitive.Root { ...rootProps }>
				<DropdownMenuPrimitive.Trigger asChild>
					{ trigger }
				</DropdownMenuPrimitive.Trigger>
				<DropdownMenuPrimitive.Portal>
					<DropdownMenuStyled.Content
						{ ...contentProps }
						ref={ forwardedRef }
					>
						{ children }
						<DropdownMenuStyled.Arrow />
					</DropdownMenuStyled.Content>
				</DropdownMenuPrimitive.Portal>
			</DropdownMenuPrimitive.Root>
		);
	}
);

export const DropdownMenuLabel = DropdownMenuStyled.Label;
export const DropdownMenuItem = DropdownMenuStyled.Item;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export const DropdownMenuCheckboxItem = forwardRef(
	(
		{
			children,
			...props
		}: DropdownMenuPrimitive.DropdownMenuCheckboxItemProps,
		forwardedRef: React.ForwardedRef< any >
	) => {
		return (
			<DropdownMenuStyled.CheckboxItem { ...props } ref={ forwardedRef }>
				{ children }
				<DropdownMenuStyled.ItemIndicator>
					{ props.checked === 'indeterminate' && (
						<DividerHorizontalIcon />
					) }
					{ props.checked === true && <CheckIcon /> }
				</DropdownMenuStyled.ItemIndicator>
			</DropdownMenuStyled.CheckboxItem>
		);
	}
);

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuRadioItem = forwardRef(
	(
		{
			children,
			...props
		}: DropdownMenuPrimitive.DropdownMenuRadioItemProps,
		forwardedRef: React.ForwardedRef< any >
	) => {
		return (
			<DropdownMenuStyled.RadioItem { ...props } ref={ forwardedRef }>
				{ children }
				<DropdownMenuStyled.ItemIndicator>
					<CheckIcon />
				</DropdownMenuStyled.ItemIndicator>
			</DropdownMenuStyled.RadioItem>
		);
	}
);

export const DropdownMenuSeparator = DropdownMenuStyled.Separator;
