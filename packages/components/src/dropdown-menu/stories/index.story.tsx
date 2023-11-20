/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { DropdownMenu } from '..';
import MenuItem from '../../menu-item';
import MenuGroup from '../../menu-group';
import Popover from '../../popover';
import { Provider as SlotFillProvider } from '../../slot-fill';

/**
 * WordPress dependencies
 */
import {
	menu,
	arrowUp,
	arrowDown,
	chevronDown,
	more,
	trash,
} from '@wordpress/icons';

const meta: Meta< typeof DropdownMenu > = {
	title: 'Components/DropdownMenu',
	component: DropdownMenu,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	argTypes: {
		icon: {
			options: [ 'menu', 'chevronDown', 'more' ],
			mapping: { menu, chevronDown, more },
			control: { type: 'select' },
		},
		open: { control: { type: null } },
		defaultOpen: { control: { type: null } },
		onToggle: { control: { type: null } },
	},
};
export default meta;

const Template: StoryFn< typeof DropdownMenu > = ( props ) => (
	<div style={ { height: 150 } }>
		<DropdownMenu { ...props } />
	</div>
);

export const Default = Template.bind( {} );
Default.args = {
	label: 'Select a direction.',
	icon: menu,
	controls: [
		{
			title: 'First Menu Item Label',
			icon: arrowUp,
			// eslint-disable-next-line no-console
			onClick: () => console.log( 'up!' ),
		},
		{
			title: 'Second Menu Item Label',
			icon: arrowDown,
			// eslint-disable-next-line no-console
			onClick: () => console.log( 'down!' ),
		},
	],
};

export const WithChildren = Template.bind( {} );
// Adding custom source because Storybook is not able to show the contents of
// the `children` prop correctly in the code snippet.
WithChildren.parameters = {
	docs: {
		source: {
			code: `<DropdownMenu label="Select a direction." icon={ more }>
  <MenuGroup>
    <MenuItem icon={ arrowUp } onClick={ onClose }>
      Move Up
    </MenuItem>
    <MenuItem icon={ arrowDown } onClick={ onClose }>
      Move Down
    </MenuItem>
  </MenuGroup>
  <MenuGroup>
    <MenuItem icon={ trash } onClick={ onClose }>
      Remove
    </MenuItem>
  </MenuGroup>
</DropdownMenu>`,
			language: 'jsx',
			type: 'auto',
		},
	},
};
WithChildren.args = {
	label: 'Select a direction.',
	icon: more,
	children: ( { onClose } ) => (
		<>
			<MenuGroup>
				<MenuItem icon={ arrowUp } onClick={ onClose }>
					Move Up
				</MenuItem>
				<MenuItem icon={ arrowDown } onClick={ onClose }>
					Move Down
				</MenuItem>
			</MenuGroup>
			<MenuGroup>
				<MenuItem icon={ trash } onClick={ onClose }>
					Remove
				</MenuItem>
			</MenuGroup>
		</>
	),
};

export const WithDefaultSlotFill: StoryFn< typeof DropdownMenu > = (
	props
) => (
	<SlotFillProvider>
		<div style={ { height: 150 } }>
			{ /* @ts-expect-error Slot is not currently typed on Popover */ }
			<Popover.Slot />
			<DropdownMenu { ...props } />
		</div>
	</SlotFillProvider>
);
WithDefaultSlotFill.args = {
	...Default.args,
};

export const WithNamedSlotFill: StoryFn< typeof DropdownMenu > = ( props ) => (
	<SlotFillProvider>
		<div style={ { height: 150 } }>
			{ /* @ts-expect-error Slot is not currently typed on Popover */ }
			<Popover.Slot name="dropdown-menu-slot-with-name" />
			<DropdownMenu { ...props } />
		</div>
	</SlotFillProvider>
);
WithNamedSlotFill.args = {
	...Default.args,
	popoverProps: {
		__unstableSlotName: 'dropdown-menu-slot-with-name',
	},
};

// @ts-expect-error __unstableSlotNameProvider is not currently typed on Popover
const SlotNameProvider = Popover.__unstableSlotNameProvider;
export const WithSlotFillViaContext: StoryFn< typeof DropdownMenu > = (
	props
) => (
	<SlotFillProvider>
		<SlotNameProvider value="dropdown-menu-slot-via-context">
			{ /* @ts-expect-error Slot is not currently typed on Popover */ }
			<Popover.Slot name="dropdown-menu-slot-via-context" />
			<div style={ { height: 150 } }>
				<DropdownMenu { ...props } />
			</div>
		</SlotNameProvider>
	</SlotFillProvider>
);
WithSlotFillViaContext.args = {
	...Default.args,
};
