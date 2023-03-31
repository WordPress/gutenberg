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
import {
	Arrow,
	CheckboxItem,
	Content,
	Item,
	ItemIndicator,
	Label,
	RadioItem,
	Root,
	Separator,
	// SubContent,
	// SubTrigger,
} from './styles';

type DropdownMenuProps = {
	/**
	 * The props passed to the dropdown's root element
	 */
	rootProps?: Omit< DropdownMenuPrimitive.DropdownMenuProps, 'children' >;
	/**
	 * The props passed to the dropdown's content
	 */
	contentProps?: Omit<
		DropdownMenuPrimitive.DropdownMenuContentProps,
		'children'
	>;
	/**
	 * The contents rendered inside the trigger
	 */
	trigger: React.ReactNode;
	/**
	 * The contents of the dropdown
	 */
	children: React.ReactNode;
};

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
			<Root { ...rootProps }>
				<DropdownMenuPrimitive.Trigger asChild>
					{ trigger }
				</DropdownMenuPrimitive.Trigger>
				<DropdownMenuPrimitive.Portal>
					<Content { ...contentProps } ref={ forwardedRef }>
						{ children }
						<Arrow />
					</Content>
				</DropdownMenuPrimitive.Portal>
			</Root>
		);
	}
);

export const DropdownMenuLabel = Label;
export const DropdownMenuItem = Item;
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
			<CheckboxItem { ...props } ref={ forwardedRef }>
				{ children }
				<ItemIndicator>
					{ props.checked === 'indeterminate' && (
						<DividerHorizontalIcon />
					) }
					{ props.checked === true && <CheckIcon /> }
				</ItemIndicator>
			</CheckboxItem>
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
			<RadioItem { ...props } ref={ forwardedRef }>
				{ children }
				<ItemIndicator>
					<CheckIcon />
				</ItemIndicator>
			</RadioItem>
		);
	}
);

export const DropdownMenuSeparator = Separator;
