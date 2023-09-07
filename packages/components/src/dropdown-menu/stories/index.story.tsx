/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useId, createContext, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { DropdownMenu } from '..';
import MenuItem from '../../menu-item';
import MenuGroup from '../../menu-group';

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

const Template: StoryFn< typeof DropdownMenu > = ( props ) => {
	const [ open, setOpen ] = useState( false );
	return (
		<div style={ { height: 150 } }>
			<DropdownMenu
				{ ...props }
				open={ open }
				onToggle={ ( willOpen ) => {
					setOpen( willOpen );
					props.onToggle?.( willOpen );
				} }
				// Only used if uncontrolled (ie. no `open` prop passed)
				// defaultOpen={ false }
			/>

			<button onClick={ () => setOpen( ! open ) }>
				Toggle (controlled update)
			</button>
		</div>
	);
};

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

const OnlyOneDropdownOpenContext = createContext< {
	openDropdownId?: string;
	setOpenDropdownId: ( id: string | undefined ) => void;
} >( {
	openDropdownId: undefined,
	setOpenDropdownId: ( _instanceId ) => {},
} );

const ItemWithDropdown = () => {
	const { openDropdownId, setOpenDropdownId } = useContext(
		OnlyOneDropdownOpenContext
	);

	const instanceId = useId();

	return (
		<div>
			Some text
			<DropdownMenu
				label="Open dropdown"
				icon={ menu }
				controls={ [
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
				] }
				open={ openDropdownId === instanceId }
				onToggle={ ( willOpen ) => {
					if ( willOpen ) {
						setOpenDropdownId( instanceId );
					} else {
						setOpenDropdownId( undefined );
					}
				} }
			/>
		</div>
	);
};

export const OnlyOneOpened: StoryFn< typeof DropdownMenu > = () => {
	const [ openDropdownId, setOpenDropdownId ] = useState<
		string | undefined
	>( undefined );

	return (
		<OnlyOneDropdownOpenContext.Provider
			value={ { openDropdownId, setOpenDropdownId } }
		>
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
			<ItemWithDropdown />
		</OnlyOneDropdownOpenContext.Provider>
	);
};
