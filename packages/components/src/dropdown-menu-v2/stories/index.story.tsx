/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { customLink, formatCapitalize } from '@wordpress/icons';
import { useState, useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils';
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuGroup,
	DropdownMenuSeparator,
	DropdownMenuContext,
	DropdownMenuRadioItem,
	DropdownMenuItemLabel,
	DropdownMenuItemHelpText,
} from '..';
import Icon from '../../icon';
import Button from '../../button';
import Modal from '../../modal';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';
import { ContextSystemProvider } from '../../context';

const meta: Meta< typeof DropdownMenu > = {
	title: 'Components (Experimental)/DropdownMenu V2',
	component: DropdownMenu,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuItem,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuCheckboxItem,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuGroup,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuSeparator,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuContext,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuRadioItem,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuItemLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuItemHelpText,
	},
	argTypes: {
		children: { control: { type: null } },
		trigger: { control: { type: null } },
	},
	tags: [ 'status-private' ],
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

export const Default: StoryFn< typeof DropdownMenu > = ( props ) => (
	<DropdownMenu { ...props }>
		<DropdownMenuItem>
			<DropdownMenuItemLabel>Label</DropdownMenuItemLabel>
		</DropdownMenuItem>
		<DropdownMenuItem>
			<DropdownMenuItemLabel>Label</DropdownMenuItemLabel>
			<DropdownMenuItemHelpText>Help text</DropdownMenuItemHelpText>
		</DropdownMenuItem>
		<DropdownMenuItem>
			<DropdownMenuItemLabel>Label</DropdownMenuItemLabel>
			<DropdownMenuItemHelpText>
				The menu item help text is automatically truncated when there
				are more than two lines of text
			</DropdownMenuItemHelpText>
		</DropdownMenuItem>
		<DropdownMenuItem hideOnClick={ false }>
			<DropdownMenuItemLabel>Label</DropdownMenuItemLabel>
			<DropdownMenuItemHelpText>
				This item doesn&apos;t close the menu on click
			</DropdownMenuItemHelpText>
		</DropdownMenuItem>
		<DropdownMenuItem disabled>Disabled item</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuGroup>
			<DropdownMenuItem
				prefix={ <Icon icon={ customLink } size={ 24 } /> }
			>
				<DropdownMenuItemLabel>With prefix</DropdownMenuItemLabel>
			</DropdownMenuItem>
			<DropdownMenuItem suffix="⌘S">With suffix</DropdownMenuItem>
			<DropdownMenuItem
				disabled
				prefix={ <Icon icon={ formatCapitalize } size={ 24 } /> }
				suffix="⌥⌘T"
			>
				<DropdownMenuItemLabel>
					Disabled with prefix and suffix
				</DropdownMenuItemLabel>
				<DropdownMenuItemHelpText>
					And help text
				</DropdownMenuItemHelpText>
			</DropdownMenuItem>
		</DropdownMenuGroup>
	</DropdownMenu>
);
Default.args = {
	trigger: (
		<Button __next40pxDefaultSize variant="secondary">
			Open menu
		</Button>
	),
};

export const WithSubmenu: StoryFn< typeof DropdownMenu > = ( props ) => (
	<DropdownMenu { ...props }>
		<DropdownMenuItem>Level 1 item</DropdownMenuItem>
		<DropdownMenu
			trigger={
				<DropdownMenuItem suffix="Suffix">
					<DropdownMenuItemLabel>
						Submenu trigger item with a long label
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			}
		>
			<DropdownMenuItem>
				<DropdownMenuItemLabel>Level 2 item</DropdownMenuItemLabel>
			</DropdownMenuItem>
			<DropdownMenuItem>
				<DropdownMenuItemLabel>Level 2 item</DropdownMenuItemLabel>
			</DropdownMenuItem>
			<DropdownMenu
				trigger={
					<DropdownMenuItem>
						<DropdownMenuItemLabel>
							Submenu trigger
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
				}
			>
				<DropdownMenuItem>
					<DropdownMenuItemLabel>Level 3 item</DropdownMenuItemLabel>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<DropdownMenuItemLabel>Level 3 item</DropdownMenuItemLabel>
				</DropdownMenuItem>
			</DropdownMenu>
		</DropdownMenu>
	</DropdownMenu>
);
WithSubmenu.args = {
	...Default.args,
};

export const WithCheckboxes: StoryFn< typeof DropdownMenu > = ( props ) => {
	const [ isAChecked, setAChecked ] = useState( false );
	const [ isBChecked, setBChecked ] = useState( true );
	const [ multipleCheckboxesValue, setMultipleCheckboxesValue ] = useState<
		string[]
	>( [ 'b' ] );

	const onMultipleCheckboxesCheckedChange: React.ComponentProps<
		typeof DropdownMenuCheckboxItem
	>[ 'onChange' ] = ( e ) => {
		setMultipleCheckboxesValue( ( prevValues ) => {
			if ( prevValues.includes( e.target.value ) ) {
				return prevValues.filter( ( val ) => val !== e.target.value );
			}
			return [ ...prevValues, e.target.value ];
		} );
	};

	return (
		<DropdownMenu { ...props }>
			<DropdownMenuGroup>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-uncontrolled-a"
					value="a"
					suffix="⌥⌘T"
				>
					<DropdownMenuItemLabel>
						Checkbox item A
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Uncontrolled
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-uncontrolled-b"
					value="b"
					defaultChecked
				>
					<DropdownMenuItemLabel>
						Checkbox item B
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Uncontrolled, initially checked
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-controlled-a"
					value="a"
					checked={ isAChecked }
					onChange={ ( e ) => setAChecked( e.target.checked ) }
				>
					<DropdownMenuItemLabel>
						Checkbox item A
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Controlled
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-controlled-b"
					value="b"
					checked={ isBChecked }
					onChange={ ( e ) => setBChecked( e.target.checked ) }
				>
					<DropdownMenuItemLabel>
						Checkbox item B
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Controlled, initially checked
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="a"
				>
					<DropdownMenuItemLabel>
						Checkbox item A
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Uncontrolled, multiple selection
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="b"
					defaultChecked
				>
					<DropdownMenuItemLabel>
						Checkbox item B
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Uncontrolled, multiple selection, initially checked
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-controlled"
					value="a"
					checked={ multipleCheckboxesValue.includes( 'a' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					<DropdownMenuItemLabel>
						Checkbox item A
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Controlled, multiple selection
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-controlled"
					value="b"
					checked={ multipleCheckboxesValue.includes( 'b' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					<DropdownMenuItemLabel>
						Checkbox item B
					</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Controlled, multiple selection, initially checked
					</DropdownMenuItemHelpText>
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
		</DropdownMenu>
	);
};
WithCheckboxes.args = {
	...Default.args,
};

export const WithRadios: StoryFn< typeof DropdownMenu > = ( props ) => {
	const [ radioValue, setRadioValue ] = useState( 'two' );
	const onRadioChange: React.ComponentProps<
		typeof DropdownMenuRadioItem
	>[ 'onChange' ] = ( e ) => setRadioValue( e.target.value );

	return (
		<DropdownMenu { ...props }>
			<DropdownMenuGroup>
				<DropdownMenuRadioItem name="radio-uncontrolled" value="one">
					<DropdownMenuItemLabel>Radio item 1</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Uncontrolled
					</DropdownMenuItemHelpText>
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem
					name="radio-uncontrolled"
					value="two"
					defaultChecked
				>
					<DropdownMenuItemLabel>Radio item 2</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Uncontrolled, initially checked
					</DropdownMenuItemHelpText>
				</DropdownMenuRadioItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuRadioItem
					name="radio-controlled"
					value="one"
					checked={ radioValue === 'one' }
					onChange={ onRadioChange }
				>
					<DropdownMenuItemLabel>Radio item 1</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Controlled
					</DropdownMenuItemHelpText>
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem
					name="radio-controlled"
					value="two"
					checked={ radioValue === 'two' }
					onChange={ onRadioChange }
				>
					<DropdownMenuItemLabel>Radio item 2</DropdownMenuItemLabel>
					<DropdownMenuItemHelpText>
						Controlled, initially checked
					</DropdownMenuItemHelpText>
				</DropdownMenuRadioItem>
			</DropdownMenuGroup>
		</DropdownMenu>
	);
};
WithRadios.args = {
	...Default.args,
};

const modalOnTopOfDropdown = css`
	&& {
		z-index: 1000000;
	}
`;

// For more examples with `Modal`, check https://ariakit.org/examples/menu-wordpress-modal
export const WithModals: StoryFn< typeof DropdownMenu > = ( props ) => {
	const [ isOuterModalOpen, setOuterModalOpen ] = useState( false );
	const [ isInnerModalOpen, setInnerModalOpen ] = useState( false );

	const cx = useCx();
	const modalOverlayClassName = cx( modalOnTopOfDropdown );

	return (
		<>
			<DropdownMenu { ...props }>
				<DropdownMenuItem
					onClick={ () => setOuterModalOpen( true ) }
					hideOnClick={ false }
				>
					<DropdownMenuItemLabel>
						Open outer modal
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={ () => setInnerModalOpen( true ) }
					hideOnClick={ false }
				>
					<DropdownMenuItemLabel>
						Open inner modal
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
				{ isInnerModalOpen && (
					<Modal
						onRequestClose={ () => setInnerModalOpen( false ) }
						overlayClassName={ modalOverlayClassName }
					>
						Modal&apos;s contents
						<button onClick={ () => setInnerModalOpen( false ) }>
							Close
						</button>
					</Modal>
				) }
			</DropdownMenu>
			{ isOuterModalOpen && (
				<Modal
					onRequestClose={ () => setOuterModalOpen( false ) }
					overlayClassName={ modalOverlayClassName }
				>
					Modal&apos;s contents
					<button onClick={ () => setOuterModalOpen( false ) }>
						Close
					</button>
				</Modal>
			) }
		</>
	);
};
WithModals.args = {
	...Default.args,
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

	return (
		<ExampleSlotFill.Slot
			fillProps={ fillProps }
			bubblesVirtually
			style={ { display: 'contents' } }
		/>
	);
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

export const WithSlotFill: StoryFn< typeof DropdownMenu > = ( props ) => {
	return (
		<SlotFillProvider>
			<DropdownMenu { ...props }>
				<DropdownMenuItem>
					<DropdownMenuItemLabel>Item</DropdownMenuItemLabel>
				</DropdownMenuItem>
				<Slot />
			</DropdownMenu>

			<Fill>
				<DropdownMenuItem>
					<DropdownMenuItemLabel>
						Item from fill
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
				<DropdownMenu
					trigger={
						<DropdownMenuItem>
							<DropdownMenuItemLabel>
								Submenu from fill
							</DropdownMenuItemLabel>
						</DropdownMenuItem>
					}
				>
					<DropdownMenuItem>
						<DropdownMenuItemLabel>
							Submenu item from fill
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
				</DropdownMenu>
			</Fill>
		</SlotFillProvider>
	);
};
WithSlotFill.args = {
	...Default.args,
};

const toolbarVariantContextValue = {
	DropdownMenu: {
		variant: 'toolbar',
	},
};
export const ToolbarVariant: StoryFn< typeof DropdownMenu > = ( props ) => (
	// TODO: add toolbar
	<ContextSystemProvider value={ toolbarVariantContextValue }>
		<DropdownMenu { ...props }>
			<DropdownMenuItem>
				<DropdownMenuItemLabel>Level 1 item</DropdownMenuItemLabel>
			</DropdownMenuItem>
			<DropdownMenuItem>
				<DropdownMenuItemLabel>Level 1 item</DropdownMenuItemLabel>
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenu
				trigger={
					<DropdownMenuItem>
						<DropdownMenuItemLabel>
							Submenu trigger
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
				}
			>
				<DropdownMenuItem>
					<DropdownMenuItemLabel>Level 2 item</DropdownMenuItemLabel>
				</DropdownMenuItem>
			</DropdownMenu>
		</DropdownMenu>
	</ContextSystemProvider>
);
ToolbarVariant.args = {
	...Default.args,
};

export const InsideModal: StoryFn< typeof DropdownMenu > = ( props ) => {
	const [ isModalOpen, setModalOpen ] = useState( false );
	return (
		<>
			<Button
				onClick={ () => setModalOpen( true ) }
				__next40pxDefaultSize
				variant="secondary"
			>
				Open modal
			</Button>
			{ isModalOpen && (
				<Modal onRequestClose={ () => setModalOpen( false ) }>
					<DropdownMenu { ...props }>
						<DropdownMenuItem>
							<DropdownMenuItemLabel>
								Level 1 item
							</DropdownMenuItemLabel>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<DropdownMenuItemLabel>
								Level 1 item
							</DropdownMenuItemLabel>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenu
							trigger={
								<DropdownMenuItem>
									<DropdownMenuItemLabel>
										Submenu trigger
									</DropdownMenuItemLabel>
								</DropdownMenuItem>
							}
						>
							<DropdownMenuItem>
								<DropdownMenuItemLabel>
									Level 2 item
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						</DropdownMenu>
					</DropdownMenu>
					<Button onClick={ () => setModalOpen( false ) }>
						Close modal
					</Button>
				</Modal>
			) }
		</>
	);
};
InsideModal.args = {
	...Default.args,
};
InsideModal.parameters = {
	docs: {
		source: { type: 'code' },
	},
};
