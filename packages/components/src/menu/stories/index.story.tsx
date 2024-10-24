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
import { Menu } from '..';
import Icon from '../../icon';
import Button from '../../button';
import Modal from '../../modal';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';
import { ContextSystemProvider } from '../../context';

const meta: Meta< typeof Menu > = {
	title: 'Components (Experimental)/Menu',
	component: Menu,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Item: Menu.Item,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CheckboxItem: Menu.CheckboxItem,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Group: Menu.Group,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		GroupLabel: Menu.GroupLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Separator: Menu.Separator,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Context: Menu.Context,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		RadioItem: Menu.RadioItem,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		ItemLabel: Menu.ItemLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		ItemHelpText: Menu.ItemHelpText,
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
};
export default meta;

export const Default: StoryFn< typeof Menu > = ( props ) => (
	<Menu { ...props }>
		<Menu.Item>
			<Menu.ItemLabel>Label</Menu.ItemLabel>
		</Menu.Item>
		<Menu.Item>
			<Menu.ItemLabel>Label</Menu.ItemLabel>
			<Menu.ItemHelpText>Help text</Menu.ItemHelpText>
		</Menu.Item>
		<Menu.Item>
			<Menu.ItemLabel>Label</Menu.ItemLabel>
			<Menu.ItemHelpText>
				The menu item help text is automatically truncated when there
				are more than two lines of text
			</Menu.ItemHelpText>
		</Menu.Item>
		<Menu.Item hideOnClick={ false }>
			<Menu.ItemLabel>Label</Menu.ItemLabel>
			<Menu.ItemHelpText>
				This item doesn&apos;t close the menu on click
			</Menu.ItemHelpText>
		</Menu.Item>
		<Menu.Item disabled>Disabled item</Menu.Item>
		<Menu.Separator />
		<Menu.Group>
			<Menu.GroupLabel>Group label</Menu.GroupLabel>
			<Menu.Item prefix={ <Icon icon={ customLink } size={ 24 } /> }>
				<Menu.ItemLabel>With prefix</Menu.ItemLabel>
			</Menu.Item>
			<Menu.Item suffix="⌘S">With suffix</Menu.Item>
			<Menu.Item
				disabled
				prefix={ <Icon icon={ formatCapitalize } size={ 24 } /> }
				suffix="⌥⌘T"
			>
				<Menu.ItemLabel>Disabled with prefix and suffix</Menu.ItemLabel>
				<Menu.ItemHelpText>And help text</Menu.ItemHelpText>
			</Menu.Item>
		</Menu.Group>
	</Menu>
);
Default.args = {
	trigger: (
		<Button __next40pxDefaultSize variant="secondary">
			Open menu
		</Button>
	),
};

export const WithSubmenu: StoryFn< typeof Menu > = ( props ) => (
	<Menu { ...props }>
		<Menu.Item>Level 1 item</Menu.Item>
		<Menu
			trigger={
				<Menu.Item suffix="Suffix">
					<Menu.ItemLabel>
						Submenu trigger item with a long label
					</Menu.ItemLabel>
				</Menu.Item>
			}
		>
			<Menu.Item>
				<Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
			</Menu.Item>
			<Menu.Item>
				<Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
			</Menu.Item>
			<Menu
				trigger={
					<Menu.Item>
						<Menu.ItemLabel>Submenu trigger</Menu.ItemLabel>
					</Menu.Item>
				}
			>
				<Menu.Item>
					<Menu.ItemLabel>Level 3 item</Menu.ItemLabel>
				</Menu.Item>
				<Menu.Item>
					<Menu.ItemLabel>Level 3 item</Menu.ItemLabel>
				</Menu.Item>
			</Menu>
		</Menu>
	</Menu>
);
WithSubmenu.args = {
	...Default.args,
};

export const WithCheckboxes: StoryFn< typeof Menu > = ( props ) => {
	const [ isAChecked, setAChecked ] = useState( false );
	const [ isBChecked, setBChecked ] = useState( true );
	const [ multipleCheckboxesValue, setMultipleCheckboxesValue ] = useState<
		string[]
	>( [ 'b' ] );

	const onMultipleCheckboxesCheckedChange: React.ComponentProps<
		typeof Menu.CheckboxItem
	>[ 'onChange' ] = ( e ) => {
		setMultipleCheckboxesValue( ( prevValues ) => {
			if ( prevValues.includes( e.target.value ) ) {
				return prevValues.filter( ( val ) => val !== e.target.value );
			}
			return [ ...prevValues, e.target.value ];
		} );
	};

	return (
		<Menu { ...props }>
			<Menu.Group>
				<Menu.GroupLabel>
					Single selection, uncontrolled
				</Menu.GroupLabel>
				<Menu.CheckboxItem
					name="checkbox-individual-uncontrolled-a"
					value="a"
					suffix="⌥⌘T"
				>
					<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially unchecked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
				<Menu.CheckboxItem
					name="checkbox-individual-uncontrolled-b"
					value="b"
					defaultChecked
				>
					<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially checked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
			</Menu.Group>
			<Menu.Separator />
			<Menu.Group>
				<Menu.GroupLabel>Single selection, controlled</Menu.GroupLabel>
				<Menu.CheckboxItem
					name="checkbox-individual-controlled-a"
					value="a"
					checked={ isAChecked }
					onChange={ ( e ) => setAChecked( e.target.checked ) }
				>
					<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially unchecked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
				<Menu.CheckboxItem
					name="checkbox-individual-controlled-b"
					value="b"
					checked={ isBChecked }
					onChange={ ( e ) => setBChecked( e.target.checked ) }
				>
					<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially checked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
			</Menu.Group>
			<Menu.Separator />
			<Menu.Group>
				<Menu.GroupLabel>
					Multiple selection, uncontrolled
				</Menu.GroupLabel>
				<Menu.CheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="a"
				>
					<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially unchecked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
				<Menu.CheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="b"
					defaultChecked
				>
					<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially checked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
			</Menu.Group>
			<Menu.Separator />
			<Menu.Group>
				<Menu.GroupLabel>
					Multiple selection, controlled
				</Menu.GroupLabel>
				<Menu.CheckboxItem
					name="checkbox-multiple-controlled"
					value="a"
					checked={ multipleCheckboxesValue.includes( 'a' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially unchecked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
				<Menu.CheckboxItem
					name="checkbox-multiple-controlled"
					value="b"
					checked={ multipleCheckboxesValue.includes( 'b' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially checked</Menu.ItemHelpText>
				</Menu.CheckboxItem>
			</Menu.Group>
		</Menu>
	);
};
WithCheckboxes.args = {
	...Default.args,
};

export const WithRadios: StoryFn< typeof Menu > = ( props ) => {
	const [ radioValue, setRadioValue ] = useState( 'two' );
	const onRadioChange: React.ComponentProps<
		typeof Menu.RadioItem
	>[ 'onChange' ] = ( e ) => setRadioValue( e.target.value );

	return (
		<Menu { ...props }>
			<Menu.Group>
				<Menu.GroupLabel>Uncontrolled</Menu.GroupLabel>
				<Menu.RadioItem name="radio-uncontrolled" value="one">
					<Menu.ItemLabel>Radio item 1</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially unchecked</Menu.ItemHelpText>
				</Menu.RadioItem>
				<Menu.RadioItem
					name="radio-uncontrolled"
					value="two"
					defaultChecked
				>
					<Menu.ItemLabel>Radio item 2</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially checked</Menu.ItemHelpText>
				</Menu.RadioItem>
			</Menu.Group>
			<Menu.Separator />
			<Menu.Group>
				<Menu.GroupLabel>Controlled</Menu.GroupLabel>
				<Menu.RadioItem
					name="radio-controlled"
					value="one"
					checked={ radioValue === 'one' }
					onChange={ onRadioChange }
				>
					<Menu.ItemLabel>Radio item 1</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially unchecked</Menu.ItemHelpText>
				</Menu.RadioItem>
				<Menu.RadioItem
					name="radio-controlled"
					value="two"
					checked={ radioValue === 'two' }
					onChange={ onRadioChange }
				>
					<Menu.ItemLabel>Radio item 2</Menu.ItemLabel>
					<Menu.ItemHelpText>Initially checked</Menu.ItemHelpText>
				</Menu.RadioItem>
			</Menu.Group>
		</Menu>
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
export const WithModals: StoryFn< typeof Menu > = ( props ) => {
	const [ isOuterModalOpen, setOuterModalOpen ] = useState( false );
	const [ isInnerModalOpen, setInnerModalOpen ] = useState( false );

	const cx = useCx();
	const modalOverlayClassName = cx( modalOnTopOfDropdown );

	return (
		<>
			<Menu { ...props }>
				<Menu.Item
					onClick={ () => setOuterModalOpen( true ) }
					hideOnClick={ false }
				>
					<Menu.ItemLabel>Open outer modal</Menu.ItemLabel>
				</Menu.Item>
				<Menu.Item
					onClick={ () => setInnerModalOpen( true ) }
					hideOnClick={ false }
				>
					<Menu.ItemLabel>Open inner modal</Menu.ItemLabel>
				</Menu.Item>
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
			</Menu>
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
	const menuContext = useContext( Menu.Context );

	// Forwarding the content of the slot so that it can be used by the fill
	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[ Menu.Context.Provider, { value: menuContext } ],
			],
		} ),
		[ menuContext ]
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

export const WithSlotFill: StoryFn< typeof Menu > = ( props ) => {
	return (
		<SlotFillProvider>
			<Menu { ...props }>
				<Menu.Item>
					<Menu.ItemLabel>Item</Menu.ItemLabel>
				</Menu.Item>
				<Slot />
			</Menu>

			<Fill>
				<Menu.Item>
					<Menu.ItemLabel>Item from fill</Menu.ItemLabel>
				</Menu.Item>
				<Menu
					trigger={
						<Menu.Item>
							<Menu.ItemLabel>Submenu from fill</Menu.ItemLabel>
						</Menu.Item>
					}
				>
					<Menu.Item>
						<Menu.ItemLabel>Submenu item from fill</Menu.ItemLabel>
					</Menu.Item>
				</Menu>
			</Fill>
		</SlotFillProvider>
	);
};
WithSlotFill.args = {
	...Default.args,
};

const toolbarVariantContextValue = {
	Menu: {
		variant: 'toolbar',
	},
};
export const ToolbarVariant: StoryFn< typeof Menu > = ( props ) => (
	// TODO: add toolbar
	<ContextSystemProvider value={ toolbarVariantContextValue }>
		<Menu { ...props }>
			<Menu.Item>
				<Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
			</Menu.Item>
			<Menu.Item>
				<Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
			</Menu.Item>
			<Menu.Separator />
			<Menu
				trigger={
					<Menu.Item>
						<Menu.ItemLabel>Submenu trigger</Menu.ItemLabel>
					</Menu.Item>
				}
			>
				<Menu.Item>
					<Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
				</Menu.Item>
			</Menu>
		</Menu>
	</ContextSystemProvider>
);
ToolbarVariant.args = {
	...Default.args,
};

export const InsideModal: StoryFn< typeof Menu > = ( props ) => {
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
					<Menu { ...props }>
						<Menu.Item>
							<Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
						</Menu.Item>
						<Menu.Item>
							<Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
						</Menu.Item>
						<Menu.Separator />
						<Menu
							trigger={
								<Menu.Item>
									<Menu.ItemLabel>
										Submenu trigger
									</Menu.ItemLabel>
								</Menu.Item>
							}
						>
							<Menu.Item>
								<Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
							</Menu.Item>
						</Menu>
					</Menu>
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
