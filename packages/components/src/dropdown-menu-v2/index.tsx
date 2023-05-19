/**
 * External dependencies
 */
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { check, chevronRightSmall, lineSolid } from '@wordpress/icons';
import { SVG, Circle } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import * as DropdownMenuStyled from './styles';
import type {
	DropdownMenuProps,
	DropdownSubMenuProps,
	DropdownMenuItemProps,
	DropdownMenuLabelProps,
	DropdownMenuGroupProps,
	DropdownMenuCheckboxItemProps,
	DropdownMenuRadioGroupProps,
	DropdownMenuRadioItemProps,
	DropdownMenuSeparatorProps,
	DropdownSubMenuTriggerProps,
} from './types';

// Menu content's side padding + 4px
const SUB_MENU_OFFSET_SIDE = 12;
// Opposite amount of the top padding of the menu item
const SUB_MENU_OFFSET_ALIGN = -8;

/**
 * `DropdownMenu` displays a menu to the user (such as a set of actions
 * or functions) triggered by a button.
 */
export const DropdownMenu = ( {
	// Root props
	defaultOpen,
	open,
	onOpenChange,
	modal = true,
	// Content positioning props
	side = 'bottom',
	sideOffset = 0,
	align = 'center',
	alignOffset = 0,
	// Render props
	children,
	trigger,
}: DropdownMenuProps ) => {
	return (
		<DropdownMenuPrimitive.Root
			defaultOpen={ defaultOpen }
			open={ open }
			onOpenChange={ onOpenChange }
			modal={ modal }
			dir={ isRTL() ? 'rtl' : 'ltr' }
		>
			<DropdownMenuPrimitive.Trigger asChild>
				{ trigger }
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuStyled.Content
					side={ side }
					align={ align }
					sideOffset={ sideOffset }
					alignOffset={ alignOffset }
					loop={ true }
				>
					{ children }
				</DropdownMenuStyled.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
};

export const DropdownSubMenuTrigger = ( {
	prefix,
	suffix = (
		<DropdownMenuStyled.SubmenuRtlChevronIcon
			icon={ chevronRightSmall }
			size={ 24 }
		/>
	),
	children,
}: DropdownSubMenuTriggerProps ) => {
	return (
		<>
			{ prefix && (
				<DropdownMenuStyled.ItemPrefixWrapper>
					{ prefix }
				</DropdownMenuStyled.ItemPrefixWrapper>
			) }
			{ children }
			{ suffix && (
				<DropdownMenuStyled.ItemSuffixWrapper>
					{ suffix }
				</DropdownMenuStyled.ItemSuffixWrapper>
			) }
		</>
	);
};

export const DropdownSubMenu = ( {
	// Sub props
	defaultOpen,
	open,
	onOpenChange,
	// Sub trigger props
	disabled,
	textValue,
	// Render props
	children,
	trigger,
}: DropdownSubMenuProps ) => {
	return (
		<DropdownMenuPrimitive.Sub
			defaultOpen={ defaultOpen }
			open={ open }
			onOpenChange={ onOpenChange }
		>
			<DropdownMenuStyled.SubTrigger
				disabled={ disabled }
				textValue={ textValue }
			>
				{ trigger }
			</DropdownMenuStyled.SubTrigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuStyled.SubContent
					loop
					sideOffset={ SUB_MENU_OFFSET_SIDE }
					alignOffset={ SUB_MENU_OFFSET_ALIGN }
				>
					{ children }
				</DropdownMenuStyled.SubContent>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Sub>
	);
};

export const DropdownMenuLabel = ( props: DropdownMenuLabelProps ) => (
	<DropdownMenuStyled.Label { ...props } />
);

export const DropdownMenuGroup = ( props: DropdownMenuGroupProps ) => (
	<DropdownMenuPrimitive.Group { ...props } />
);

export const DropdownMenuItem = forwardRef(
	(
		{ children, prefix, suffix, ...props }: DropdownMenuItemProps,
		forwardedRef: React.ForwardedRef< any >
	) => {
		return (
			<DropdownMenuStyled.Item { ...props } ref={ forwardedRef }>
				{ prefix && (
					<DropdownMenuStyled.ItemPrefixWrapper>
						{ prefix }
					</DropdownMenuStyled.ItemPrefixWrapper>
				) }
				{ children }
				{ suffix && (
					<DropdownMenuStyled.ItemSuffixWrapper>
						{ suffix }
					</DropdownMenuStyled.ItemSuffixWrapper>
				) }
			</DropdownMenuStyled.Item>
		);
	}
);

export const DropdownMenuCheckboxItem = ( {
	children,
	checked = false,
	suffix,
	...props
}: DropdownMenuCheckboxItemProps ) => {
	return (
		<DropdownMenuStyled.CheckboxItem { ...props } checked={ checked }>
			<DropdownMenuStyled.ItemPrefixWrapper>
				<DropdownMenuStyled.ItemIndicator>
					{ ( checked === 'indeterminate' || checked === true ) && (
						<Icon
							icon={
								checked === 'indeterminate' ? lineSolid : check
							}
							size={ 24 }
						/>
					) }
				</DropdownMenuStyled.ItemIndicator>
			</DropdownMenuStyled.ItemPrefixWrapper>
			{ children }
			{ suffix && (
				<DropdownMenuStyled.ItemSuffixWrapper>
					{ suffix }
				</DropdownMenuStyled.ItemSuffixWrapper>
			) }
		</DropdownMenuStyled.CheckboxItem>
	);
};

export const DropdownMenuRadioGroup = (
	props: DropdownMenuRadioGroupProps
) => <DropdownMenuPrimitive.RadioGroup { ...props } />;

const radioDot = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Circle cx={ 12 } cy={ 12 } r={ 3 } fill="currentColor"></Circle>
	</SVG>
);

export const DropdownMenuRadioItem = ( {
	children,
	suffix,
	...props
}: DropdownMenuRadioItemProps ) => {
	return (
		<DropdownMenuStyled.RadioItem { ...props }>
			<DropdownMenuStyled.ItemPrefixWrapper>
				<DropdownMenuStyled.ItemIndicator>
					<Icon icon={ radioDot } size={ 22 } />
				</DropdownMenuStyled.ItemIndicator>
			</DropdownMenuStyled.ItemPrefixWrapper>
			{ children }
			{ suffix && (
				<DropdownMenuStyled.ItemSuffixWrapper>
					{ suffix }
				</DropdownMenuStyled.ItemSuffixWrapper>
			) }
		</DropdownMenuStyled.RadioItem>
	);
};

export const DropdownMenuSeparator = ( props: DropdownMenuSeparatorProps ) => (
	<DropdownMenuStyled.Separator { ...props } />
);
