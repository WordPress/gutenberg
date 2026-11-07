import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from '@wordpress/element';
import {
	check,
	menu,
	arrowUp,
	arrowDown,
	chevronDown,
	more,
	trash,
	link,
} from '@wordpress/icons';
import { DropdownMenu } from '..';
import MenuItem from '../../menu-item';
import MenuGroup from '../../menu-group';
import MenuItemsChoice from '../../menu-items-choice';

const meta: Meta< typeof DropdownMenu > = {
	title: 'Components/@wordpress-components/Actions/DropdownMenu',
	component: DropdownMenu,
	id: 'components-dropdownmenu',
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'When building for the Gutenberg repo, use [`Menu`](?path=/docs/design-system-components-menu--docs) from `@wordpress/ui` instead. Otherwise, continue using `DropdownMenu` for now.',
		},
	},
	args: {
		onToggle: fn(),
	},
	argTypes: {
		icon: {
			options: [ 'menu', 'chevronDown', 'more' ],
			mapping: { menu, chevronDown, more },
			control: { type: 'select' },
		},
		open: { control: false },
		defaultOpen: { control: false },
		onToggle: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof DropdownMenu > = {
	args: {
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
	},
};

export const WithChildren: StoryObj< typeof DropdownMenu > = {
	...Default,
	// Adding custom source because Storybook is not able to show the contents of
	// the `children` prop correctly in the code snippet.
	parameters: {
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
	},
	args: {
		label: 'Select a direction.',
		icon: more,
		children: ( { onClose } ) => (
			<>
				<MenuItem icon={ arrowUp } onClick={ onClose }>
					Standalone Item
				</MenuItem>
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
	},
};

/**
 * Use `MenuItemsChoice` for mutually exclusive selections. It renders radio menu
 * items and a check icon for the selected choice. This example keeps the popup
 * open when the selection changes.
 */
export const SingleSelection: StoryObj< typeof DropdownMenu > = {
	parameters: {
		docs: { canvas: { sourceState: 'hidden' } },
	},
	args: {
		label: 'Editor options',
		icon: more,
	},
	render: function Render( args ) {
		const [ mode, setMode ] = useState( 'visual' );

		return (
			<DropdownMenu { ...args }>
				{ () => (
					<MenuGroup label="Editor">
						<MenuItemsChoice
							choices={ [
								{ value: 'visual', label: 'Visual editor' },
								{ value: 'code', label: 'Code editor' },
							] }
							value={ mode }
							onSelect={ setMode }
						/>
					</MenuGroup>
				) }
			</DropdownMenu>
		);
	},
};

/**
 * Use `MenuItem` with `role="menuitemcheckbox"` for independent selections.
 * Set `isSelected` and a check icon for each selected item. Keep the popup open
 * by updating the selection without calling `onClose`.
 */
export const MultiSelection: StoryObj< typeof DropdownMenu > = {
	parameters: {
		docs: { canvas: { sourceState: 'hidden' } },
	},
	args: {
		label: 'Typography options',
		icon: more,
	},
	render: function Render( args ) {
		const [ selectedOptions, setSelectedOptions ] = useState( [ 'Font' ] );
		const toggleOption = ( option: string ) => {
			setSelectedOptions( ( options ) =>
				options.includes( option )
					? options.filter( ( item ) => item !== option )
					: [ ...options, option ]
			);
		};

		return (
			<DropdownMenu { ...args }>
				{ () => (
					<MenuGroup label="Typography">
						{ [ 'Font', 'Font size', 'Line height' ].map(
							( option ) => {
								const isSelected =
									selectedOptions.includes( option );

								return (
									<MenuItem
										key={ option }
										role="menuitemcheckbox"
										isSelected={ isSelected }
										icon={ isSelected ? check : null }
										onClick={ () => toggleOption( option ) }
									>
										{ option }
									</MenuItem>
								);
							}
						) }
					</MenuGroup>
				) }
			</DropdownMenu>
		);
	},
};

/**
 * Selection rows share their leading selection space with ordinary actions.
 * Action icons keep their explicit position and indent only their own label.
 */
export const MixedContent: StoryObj< typeof DropdownMenu > = {
	args: { label: 'Mixed menu', icon: more },
	render: function Render( args ) {
		const [ mode, setMode ] = useState( 'code' );
		return (
			<DropdownMenu { ...args }>
				{ ( { onClose } ) => (
					<>
						<MenuGroup label="Editor">
							<MenuItem onClick={ onClose }>
								Plain action
							</MenuItem>
							<MenuItemsChoice
								value={ mode }
								onSelect={ setMode }
								choices={ [
									{
										value: 'visual',
										label: 'Visual editor',
										shortcut: 'Ctrl+V',
									},
									{
										value: 'code',
										label: 'Code editor',
										info: 'Edit the source of your content.',
										shortcut: 'Ctrl+C',
									},
								] }
							/>
							<MenuItem shortcut="Ctrl+P" onClick={ onClose }>
								Preview
							</MenuItem>
							<MenuItem
								suffix={ <span>Draft</span> }
								onClick={ onClose }
							>
								Save
							</MenuItem>
						</MenuGroup>
						<MenuGroup label="Actions">
							<MenuItem
								icon={ link }
								iconPosition="left"
								onClick={ onClose }
							>
								Leading action icon
							</MenuItem>
							<MenuItem onClick={ onClose }>
								Action without an icon
							</MenuItem>
							<MenuItem
								icon={ trash }
								iconPosition="right"
								onClick={ onClose }
							>
								Trailing action icon
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		);
	},
};

/**
 * Prefix icons indent only their own label. Controls without icons start at the
 * icon column. Selection state and activation remain controlled by the caller.
 */
export const MixedControls: StoryObj< typeof DropdownMenu > = {
	args: { label: 'Control options', icon: more },
	render: function Render( args ) {
		const [ showDetails, setShowDetails ] = useState( true );
		return (
			<DropdownMenu
				{ ...args }
				controls={ [
					{ title: 'Move up', icon: arrowUp },
					{ title: 'Action without an icon' },
					{
						title: 'Show details',
						icon: more,
						role: 'menuitemcheckbox',
						isActive: showDetails,
						onClick: () => setShowDetails( ! showDetails ),
					},
					{
						title: 'Unavailable action',
						icon: arrowDown,
						isDisabled: true,
					},
				] }
			/>
		);
	},
};

export const IconOnlyControls: StoryObj< typeof DropdownMenu > = {
	args: {
		label: 'Icon controls',
		icon: more,
		controls: [
			{ title: '', label: 'Move up', icon: arrowUp },
			{ title: '', label: 'Move down', icon: arrowDown },
		],
	},
};
