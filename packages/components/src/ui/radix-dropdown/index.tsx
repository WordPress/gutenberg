/**
 * External dependencies
 */
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { SVG, Circle } from '@wordpress/primitives';
import { check, lineSolid } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../../icon';
import * as DropdownMenuStyled from './styles';
import type {
	DropdownMenuProps,
	DropdownSubMenuProps,
	DropdownItemProps,
	DropdownMenuLabelProps,
	DropdownMenuGroupProps,
	DropdownMenuCheckboxItemProps,
	DropdownMenuRadioGroupProps,
	DropdownMenuRadioItemProps,
	DropdownMenuSeparatorProps,
} from './types';

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
// - DropdowmMenuItem icon prop:
//   - added to mirror previous menu item component
//   - should we expect consumers to provide this directly with children?
//   - should we expose prefix / suffix to help?
// - Props: should we export HTML-inherited props? (e.g styles, classnames, hidden, etc..)
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
					<DropdownMenuStyled.Arrow />
				</DropdownMenuStyled.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
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
				asChild
			>
				{ trigger }
			</DropdownMenuStyled.SubTrigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuStyled.SubContent
					loop
					sideOffset={ 4 }
					alignOffset={ -8 }
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
		{ children, prefix, suffix, ...props }: DropdownItemProps,
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
				{ /*
					TODO: adding `asChild` seems to trigger an error due to the fact
					that `Icon` doesn't forward refs to the underlying dom elements.
					*/ }
				<DropdownMenuPrimitive.ItemIndicator asChild>
					{ ( checked === 'indeterminate' || checked === true ) && (
						<Icon
							icon={
								checked === 'indeterminate' ? lineSolid : check
							}
							size={ 20 }
						/>
					) }
				</DropdownMenuPrimitive.ItemIndicator>
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
				{ /*
					TODO: adding `asChild` seems to trigger an error due to the fact
					that `Icon` doesn't forward refs to the underlying dom elements.
					*/ }
				<DropdownMenuPrimitive.ItemIndicator asChild>
					<Icon icon={ radioDot } size={ 20 } />
				</DropdownMenuPrimitive.ItemIndicator>
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
