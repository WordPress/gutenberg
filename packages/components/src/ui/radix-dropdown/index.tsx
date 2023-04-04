/**
 * External dependencies
 */
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
	CheckIcon,
	DotFilledIcon,
	DividerHorizontalIcon,
} from '@radix-ui/react-icons';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as DropdownMenuStyled from './styles';
import type { DropdownMenuProps, DropdownSubMenuProps } from './types';

// Observations / Questions:
// - is it enough on the larger components to have only one forwarded ref?
//   If we have only one, should it be to the "root", the "trigger", or the "content"?
// - Should we be consistent in using the same value for the `asChild` prop on:
//   - trigger
//   - content
//   - sub trigger
//   - sub content
// - Should we allow customizing the `asChild` prop on trigger and content?
// - Props & customisability:
//   - Which props should we expose?
//   - Should props be "namespaced" for each subcomponent?
//   - We should probably explicitly `Pick<>` every prop that we want to expose
// - Subtrigger arrow:
//   - Should it always be there (ie. an internal implementation)?
//   - Should we just expect that the the consumers handle it themselves?
//   - Should we expose it as a separate component that consumers could use?
export const DropdownMenu = forwardRef(
	(
		{
			children,
			rootProps,
			portalProps,
			contentProps,
			trigger,
		}: DropdownMenuProps,
		forwardedRef: React.ForwardedRef< any >
	) => {
		return (
			<DropdownMenuPrimitive.Root { ...rootProps }>
				<DropdownMenuPrimitive.Trigger asChild>
					{ trigger }
				</DropdownMenuPrimitive.Trigger>
				<DropdownMenuPrimitive.Portal { ...portalProps }>
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

export const DropdownSubMenu = forwardRef(
	(
		{
			children,
			subProps,
			subContentProps,
			portalProps,
			trigger,
			triggerProps,
		}: DropdownSubMenuProps,
		forwardedRef: React.ForwardedRef< any >
	) => {
		return (
			<DropdownMenuPrimitive.Sub { ...subProps }>
				<DropdownMenuStyled.SubTrigger { ...triggerProps }>
					{ trigger }
					{ /* Arrow? */ }
				</DropdownMenuStyled.SubTrigger>
				<DropdownMenuPrimitive.Portal { ...portalProps }>
					<DropdownMenuStyled.SubContent
						{ ...subContentProps }
						ref={ forwardedRef }
					>
						{ children }
					</DropdownMenuStyled.SubContent>
				</DropdownMenuPrimitive.Portal>
			</DropdownMenuPrimitive.Sub>
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
					<DotFilledIcon />
				</DropdownMenuStyled.ItemIndicator>
			</DropdownMenuStyled.RadioItem>
		);
	}
);

export const DropdownMenuSeparator = DropdownMenuStyled.Separator;
