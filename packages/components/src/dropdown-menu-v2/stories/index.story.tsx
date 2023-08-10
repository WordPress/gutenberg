/**
 * External dependencies
 */
import type { Meta, Story } from '@storybook/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS } from '../../utils';
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownSubMenu,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownSubMenuTrigger,
} from '..';
import Button from '../../button';
import Popover from '../../popover';
import { Provider as SlotFillProvider } from '../../slot-fill';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { menu, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../../icon';
import { ContextSystemProvider } from '../../ui/context';

const meta: Meta< typeof DropdownMenu > = {
	title: 'Components (Experimental)/DropdownMenu v2',
	component: DropdownMenu,
	argTypes: {
		children: { control: { type: null } },
		trigger: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open', excludeDecorators: true } },
	},
	decorators: [
		// Layout wrapper
		( Story ) => (
			<div
				style={ {
					minHeight: '300px',
				} }
			>
				<Story />
			</div>
		),
	],
};
export default meta;

const ItemHelpText = styled.span`
	font-size: 12px;
	color: ${ COLORS.gray[ '700' ] };

	/* "> * > &" syntax is to target only immediate parent menu item */
	[data-highlighted] > * > &,
	[data-state='open'] > * > &,
	[data-disabled] > * & {
		color: inherit;
	}
`;

const CheckboxItemsGroup = () => {
	const [ itemOneChecked, setItemOneChecked ] = useState( true );
	const [ itemTwoChecked, setItemTwoChecked ] = useState( false );

	return (
		<DropdownMenuGroup>
			<DropdownMenuLabel>Checkbox group label</DropdownMenuLabel>
			<DropdownMenuCheckboxItem
				checked={ itemOneChecked }
				onCheckedChange={ setItemOneChecked }
				suffix={ <span>⌘+B</span> }
			>
				Checkbox item one
			</DropdownMenuCheckboxItem>

			<DropdownMenuCheckboxItem
				checked={ itemTwoChecked }
				onCheckedChange={ setItemTwoChecked }
			>
				Checkbox item two
			</DropdownMenuCheckboxItem>
		</DropdownMenuGroup>
	);
};

const RadioItemsGroup = () => {
	const [ radioValue, setRadioValue ] = useState( 'radio-one' );

	return (
		<DropdownMenuRadioGroup
			value={ radioValue }
			onValueChange={ setRadioValue }
		>
			<DropdownMenuLabel>Radio group label</DropdownMenuLabel>
			<DropdownMenuRadioItem value="radio-one">
				Radio item one
			</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="radio-two">
				Radio item two
			</DropdownMenuRadioItem>
		</DropdownMenuRadioGroup>
	);
};

const Template: Story< typeof DropdownMenu > = ( props ) => (
	<SlotFillProvider>
		<DropdownMenu { ...props } />
		{ /* @ts-expect-error Slot is not currently typed on Popover */ }
		<Popover.Slot />
	</SlotFillProvider>
);
export const Default = Template.bind( {} );
Default.args = {
	trigger: <Button __next40pxDefaultSize label="Open menu" icon={ menu } />,
	sideOffset: 12,
	children: (
		<>
			<DropdownMenuGroup>
				<DropdownMenuItem>Menu item</DropdownMenuItem>
				<DropdownMenuItem
					prefix={ <Icon icon={ wordpress } size={ 24 } /> }
				>
					Menu item with prefix
				</DropdownMenuItem>
				<DropdownMenuItem suffix={ <span>⌥⌘T</span> }>
					Menu item with suffix
				</DropdownMenuItem>
				<DropdownMenuItem disabled>Disabled menu item</DropdownMenuItem>
				<DropdownSubMenu
					trigger={
						<DropdownSubMenuTrigger>Submenu</DropdownSubMenuTrigger>
					}
				>
					<DropdownMenuItem suffix={ <span>⌘+S</span> }>
						Submenu item with suffix
					</DropdownMenuItem>
					<DropdownMenuItem>
						<div
							style={ {
								display: 'inline-flex',
								flexDirection: 'column',
							} }
						>
							Submenu item
							<ItemHelpText>
								With additional custom text
							</ItemHelpText>
						</div>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownSubMenu
						trigger={
							<DropdownSubMenuTrigger>
								Second level submenu
							</DropdownSubMenuTrigger>
						}
					>
						<DropdownMenuItem>Submenu item</DropdownMenuItem>
						<DropdownMenuItem>Submenu item</DropdownMenuItem>
					</DropdownSubMenu>
				</DropdownSubMenu>
			</DropdownMenuGroup>

			<DropdownMenuSeparator />

			<CheckboxItemsGroup />

			<DropdownMenuSeparator />

			<RadioItemsGroup />
		</>
	),
};

const toolbarVariantContextValue = {
	DropdownMenu: {
		variant: 'toolbar',
	},
};
export const ToolbarVariant: Story< typeof DropdownMenu > = ( props ) => (
	<ContextSystemProvider value={ toolbarVariantContextValue }>
		<DropdownMenu { ...props } />
	</ContextSystemProvider>
);
ToolbarVariant.args = {
	...Default.args,
};
