/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { menu } from '@wordpress/icons';
import { useState, useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuGroup,
	DropdownMenuGroupLabel,
	DropdownMenuSeparator,
	DropdownMenuContext,
} from '..';
import Button from '../../button';
import Modal from '../../modal';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';

const meta: Meta< typeof DropdownMenu > = {
	title: 'Components (Experimental)/DropdownMenu v2 ariakit',
	component: DropdownMenu,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuItem,
	},
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			source: { excludeDecorators: true },
		},
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

const Template: StoryFn< typeof DropdownMenu > = ( props ) => (
	<DropdownMenu { ...props } />
);
export const Default = Template.bind( {} );
Default.args = {
	trigger: <Button __next40pxDefaultSize label="Open menu" icon={ menu } />,
	children: (
		<>
			<DropdownMenuItem>Single item</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuGroupLabel>Group</DropdownMenuGroupLabel>
				<DropdownMenuItem>One</DropdownMenuItem>
				<DropdownMenuItem>Two</DropdownMenuItem>
				<DropdownMenuItem>Three</DropdownMenuItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuGroupLabel>
					Checks (separate)
				</DropdownMenuGroupLabel>
				<DropdownMenuCheckboxItem name="checkbox-a" value="a">
					Checkbox item A
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem name="checkbox-b" value="b">
					Checkbox item B
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenu
				trigger={ <DropdownMenuItem>Open submenu</DropdownMenuItem> }
			>
				<DropdownMenuItem>Start Speaking</DropdownMenuItem>
				<DropdownMenuItem disabled>Stop Speaking</DropdownMenuItem>
			</DropdownMenu>
		</>
	),
};

export const WithControlledCheckboxes: StoryFn< typeof DropdownMenu > = (
	props
) => {
	const [ isAChecked, setAChecked ] = useState( false );
	const [ isBChecked, setBChecked ] = useState( true );
	return (
		<DropdownMenu { ...props }>
			<DropdownMenuCheckboxItem
				name="checkbox-a"
				value="a"
				checked={ isAChecked }
				onChange={ ( e ) => setAChecked( e.target.checked ) }
			>
				Checkbox item A (controlled)
			</DropdownMenuCheckboxItem>
			<DropdownMenuCheckboxItem
				name="checkbox-b"
				value="b"
				checked={ isBChecked }
				onChange={ ( e ) => setBChecked( e.target.checked ) }
			>
				Checkbox item B (controlled, checked by default)
			</DropdownMenuCheckboxItem>
			<DropdownMenuCheckboxItem
				name="checkbox-c"
				value="c"
				defaultChecked
			>
				Checkbox item C (uncontrolled, checked by default)
			</DropdownMenuCheckboxItem>
		</DropdownMenu>
	);
};
WithControlledCheckboxes.args = {
	trigger: <Button __next40pxDefaultSize label="Open menu" icon={ menu } />,
};

export const WithModalAsSiblingOfMenu: StoryFn< typeof DropdownMenu > = (
	props
) => {
	const [ isModalOpen, setModalOpen ] = useState( false );
	return (
		<>
			<DropdownMenu { ...props }>
				<DropdownMenuItem onClick={ () => setModalOpen( true ) }>
					Open modal
				</DropdownMenuItem>
			</DropdownMenu>
			{ isModalOpen && (
				<Modal onRequestClose={ () => setModalOpen( false ) }>
					Modal&apos;s contents
					<button onClick={ () => setModalOpen( false ) }>
						Close
					</button>
				</Modal>
			) }
		</>
	);
};
WithModalAsSiblingOfMenu.args = {
	trigger: <Button __next40pxDefaultSize label="Open menu" icon={ menu } />,
};

export const WithModalAsSiblingOfMenuItem: StoryFn< typeof DropdownMenu > = (
	props
) => {
	const [ isModalOpen, setModalOpen ] = useState( false );
	return (
		<DropdownMenu { ...props }>
			<DropdownMenuItem
				hideOnClick={ false }
				onClick={ () => setModalOpen( true ) }
			>
				Open modal
			</DropdownMenuItem>
			{ isModalOpen && (
				<Modal onRequestClose={ () => setModalOpen( false ) }>
					Yo!
					<button onClick={ () => setModalOpen( false ) }>
						Modal&apos;s contents
					</button>
				</Modal>
			) }
		</DropdownMenu>
	);
};
WithModalAsSiblingOfMenuItem.args = {
	trigger: <Button __next40pxDefaultSize label="Open menu" icon={ menu } />,
};

const ExampleSlotFill = createSlotFill( 'Example' );

const Slot = () => {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	// Forwarding the content of the slot so that it can be used by the fill
	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[
					DropdownMenuContext.Provider,
					{ value: dropdownMenuContext },
				],
			],
		} ),
		[ dropdownMenuContext ]
	);

	return <ExampleSlotFill.Slot fillProps={ fillProps } bubblesVirtually />;
};

type ForwardedContextTuple< P = {} > = [
	React.ComponentType< React.PropsWithChildren< P > >,
	P,
];

const Fill = ( { children }: { children: React.ReactNode } ) => {
	const innerMarkup = <>{ children }</>;

	return (
		<ExampleSlotFill.Fill>
			{ ( fillProps: { forwardedContext?: ForwardedContextTuple[] } ) => {
				const { forwardedContext = [] } = fillProps;

				return forwardedContext.reduce(
					( inner: JSX.Element, [ Provider, props ] ) => (
						<Provider { ...props }>{ inner }</Provider>
					),
					innerMarkup
				);
			} }
		</ExampleSlotFill.Fill>
	);
};

export const AddItemsViaSlotFill: StoryFn< typeof DropdownMenu > = (
	props
) => {
	return (
		<SlotFillProvider>
			<DropdownMenu { ...props }>
				<DropdownMenuItem>Item</DropdownMenuItem>
				<DropdownMenu
					trigger={ <DropdownMenuItem>Nested</DropdownMenuItem> }
				>
					<Slot />
				</DropdownMenu>
			</DropdownMenu>

			<Fill>
				<DropdownMenuItem hideOnClick={ false }>
					Item from fill
				</DropdownMenuItem>
				<DropdownMenu
					trigger={
						<DropdownMenuItem>Nested in fill</DropdownMenuItem>
					}
				>
					<DropdownMenuItem hideOnClick={ false }>
						Test
					</DropdownMenuItem>
				</DropdownMenu>
			</Fill>
		</SlotFillProvider>
	);
};
AddItemsViaSlotFill.args = {
	trigger: <Button __next40pxDefaultSize label="Open menu" icon={ menu } />,
};
