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
import DropdownMenuV2 from '..';
import Icon from '../../icon';
import Button from '../../button';
import Modal from '../../modal';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';
import { ContextSystemProvider } from '../../context';

const meta: Meta< typeof DropdownMenuV2 > = {
	title: 'Components (Experimental)/DropdownMenu V2',
	component: DropdownMenuV2,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Item: DropdownMenuV2.Item,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		CheckboxItem: DropdownMenuV2.CheckboxItem,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Group: DropdownMenuV2.Group,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		GroupLabel: DropdownMenuV2.GroupLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Separator: DropdownMenuV2.Separator,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Context: DropdownMenuV2.Context,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		RadioItem: DropdownMenuV2.RadioItem,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		ItemLabel: DropdownMenuV2.ItemLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		ItemHelpText: DropdownMenuV2.ItemHelpText,
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

export const Default: StoryFn< typeof DropdownMenuV2 > = ( props ) => (
	<DropdownMenuV2 { ...props }>
		<DropdownMenuV2.Item>
			<DropdownMenuV2.ItemLabel>Label</DropdownMenuV2.ItemLabel>
		</DropdownMenuV2.Item>
		<DropdownMenuV2.Item>
			<DropdownMenuV2.ItemLabel>Label</DropdownMenuV2.ItemLabel>
			<DropdownMenuV2.ItemHelpText>Help text</DropdownMenuV2.ItemHelpText>
		</DropdownMenuV2.Item>
		<DropdownMenuV2.Item>
			<DropdownMenuV2.ItemLabel>Label</DropdownMenuV2.ItemLabel>
			<DropdownMenuV2.ItemHelpText>
				The menu item help text is automatically truncated when there
				are more than two lines of text
			</DropdownMenuV2.ItemHelpText>
		</DropdownMenuV2.Item>
		<DropdownMenuV2.Item hideOnClick={ false }>
			<DropdownMenuV2.ItemLabel>Label</DropdownMenuV2.ItemLabel>
			<DropdownMenuV2.ItemHelpText>
				This item doesn&apos;t close the menu on click
			</DropdownMenuV2.ItemHelpText>
		</DropdownMenuV2.Item>
		<DropdownMenuV2.Item disabled>Disabled item</DropdownMenuV2.Item>
		<DropdownMenuV2.Separator />
		<DropdownMenuV2.Group>
			<DropdownMenuV2.GroupLabel>Group label</DropdownMenuV2.GroupLabel>
			<DropdownMenuV2.Item
				prefix={ <Icon icon={ customLink } size={ 24 } /> }
			>
				<DropdownMenuV2.ItemLabel>With prefix</DropdownMenuV2.ItemLabel>
			</DropdownMenuV2.Item>
			<DropdownMenuV2.Item suffix="⌘S">With suffix</DropdownMenuV2.Item>
			<DropdownMenuV2.Item
				disabled
				prefix={ <Icon icon={ formatCapitalize } size={ 24 } /> }
				suffix="⌥⌘T"
			>
				<DropdownMenuV2.ItemLabel>
					Disabled with prefix and suffix
				</DropdownMenuV2.ItemLabel>
				<DropdownMenuV2.ItemHelpText>
					And help text
				</DropdownMenuV2.ItemHelpText>
			</DropdownMenuV2.Item>
		</DropdownMenuV2.Group>
	</DropdownMenuV2>
);
Default.args = {
	trigger: (
		<Button __next40pxDefaultSize variant="secondary">
			Open menu
		</Button>
	),
};

export const WithSubmenu: StoryFn< typeof DropdownMenuV2 > = ( props ) => (
	<DropdownMenuV2 { ...props }>
		<DropdownMenuV2.Item>Level 1 item</DropdownMenuV2.Item>
		<DropdownMenuV2
			trigger={
				<DropdownMenuV2.Item suffix="Suffix">
					<DropdownMenuV2.ItemLabel>
						Submenu trigger item with a long label
					</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
			}
		>
			<DropdownMenuV2.Item>
				<DropdownMenuV2.ItemLabel>
					Level 2 item
				</DropdownMenuV2.ItemLabel>
			</DropdownMenuV2.Item>
			<DropdownMenuV2.Item>
				<DropdownMenuV2.ItemLabel>
					Level 2 item
				</DropdownMenuV2.ItemLabel>
			</DropdownMenuV2.Item>
			<DropdownMenuV2
				trigger={
					<DropdownMenuV2.Item>
						<DropdownMenuV2.ItemLabel>
							Submenu trigger
						</DropdownMenuV2.ItemLabel>
					</DropdownMenuV2.Item>
				}
			>
				<DropdownMenuV2.Item>
					<DropdownMenuV2.ItemLabel>
						Level 3 item
					</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
				<DropdownMenuV2.Item>
					<DropdownMenuV2.ItemLabel>
						Level 3 item
					</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
			</DropdownMenuV2>
		</DropdownMenuV2>
	</DropdownMenuV2>
);
WithSubmenu.args = {
	...Default.args,
};

export const WithCheckboxes: StoryFn< typeof DropdownMenuV2 > = ( props ) => {
	const [ isAChecked, setAChecked ] = useState( false );
	const [ isBChecked, setBChecked ] = useState( true );
	const [ multipleCheckboxesValue, setMultipleCheckboxesValue ] = useState<
		string[]
	>( [ 'b' ] );

	const onMultipleCheckboxesCheckedChange: React.ComponentProps<
		typeof DropdownMenuV2.CheckboxItem
	>[ 'onChange' ] = ( e ) => {
		setMultipleCheckboxesValue( ( prevValues ) => {
			if ( prevValues.includes( e.target.value ) ) {
				return prevValues.filter( ( val ) => val !== e.target.value );
			}
			return [ ...prevValues, e.target.value ];
		} );
	};

	return (
		<DropdownMenuV2 { ...props }>
			<DropdownMenuV2.Group>
				<DropdownMenuV2.GroupLabel>
					Single selection, uncontrolled
				</DropdownMenuV2.GroupLabel>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-individual-uncontrolled-a"
					value="a"
					suffix="⌥⌘T"
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item A
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially unchecked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-individual-uncontrolled-b"
					value="b"
					defaultChecked
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item B
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially checked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
			</DropdownMenuV2.Group>
			<DropdownMenuV2.Separator />
			<DropdownMenuV2.Group>
				<DropdownMenuV2.GroupLabel>
					Single selection, controlled
				</DropdownMenuV2.GroupLabel>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-individual-controlled-a"
					value="a"
					checked={ isAChecked }
					onChange={ ( e ) => setAChecked( e.target.checked ) }
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item A
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially unchecked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-individual-controlled-b"
					value="b"
					checked={ isBChecked }
					onChange={ ( e ) => setBChecked( e.target.checked ) }
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item B
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially checked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
			</DropdownMenuV2.Group>
			<DropdownMenuV2.Separator />
			<DropdownMenuV2.Group>
				<DropdownMenuV2.GroupLabel>
					Multiple selection, uncontrolled
				</DropdownMenuV2.GroupLabel>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="a"
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item A
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially unchecked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="b"
					defaultChecked
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item B
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially checked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
			</DropdownMenuV2.Group>
			<DropdownMenuV2.Separator />
			<DropdownMenuV2.Group>
				<DropdownMenuV2.GroupLabel>
					Multiple selection, controlled
				</DropdownMenuV2.GroupLabel>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-multiple-controlled"
					value="a"
					checked={ multipleCheckboxesValue.includes( 'a' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item A
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially unchecked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
				<DropdownMenuV2.CheckboxItem
					name="checkbox-multiple-controlled"
					value="b"
					checked={ multipleCheckboxesValue.includes( 'b' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					<DropdownMenuV2.ItemLabel>
						Checkbox item B
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially checked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.CheckboxItem>
			</DropdownMenuV2.Group>
		</DropdownMenuV2>
	);
};
WithCheckboxes.args = {
	...Default.args,
};

export const WithRadios: StoryFn< typeof DropdownMenuV2 > = ( props ) => {
	const [ radioValue, setRadioValue ] = useState( 'two' );
	const onRadioChange: React.ComponentProps<
		typeof DropdownMenuV2.RadioItem
	>[ 'onChange' ] = ( e ) => setRadioValue( e.target.value );

	return (
		<DropdownMenuV2 { ...props }>
			<DropdownMenuV2.Group>
				<DropdownMenuV2.GroupLabel>
					Uncontrolled
				</DropdownMenuV2.GroupLabel>
				<DropdownMenuV2.RadioItem name="radio-uncontrolled" value="one">
					<DropdownMenuV2.ItemLabel>
						Radio item 1
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially unchecked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.RadioItem>
				<DropdownMenuV2.RadioItem
					name="radio-uncontrolled"
					value="two"
					defaultChecked
				>
					<DropdownMenuV2.ItemLabel>
						Radio item 2
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially checked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.RadioItem>
			</DropdownMenuV2.Group>
			<DropdownMenuV2.Separator />
			<DropdownMenuV2.Group>
				<DropdownMenuV2.GroupLabel>
					Controlled
				</DropdownMenuV2.GroupLabel>
				<DropdownMenuV2.RadioItem
					name="radio-controlled"
					value="one"
					checked={ radioValue === 'one' }
					onChange={ onRadioChange }
				>
					<DropdownMenuV2.ItemLabel>
						Radio item 1
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially unchecked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.RadioItem>
				<DropdownMenuV2.RadioItem
					name="radio-controlled"
					value="two"
					checked={ radioValue === 'two' }
					onChange={ onRadioChange }
				>
					<DropdownMenuV2.ItemLabel>
						Radio item 2
					</DropdownMenuV2.ItemLabel>
					<DropdownMenuV2.ItemHelpText>
						Initially checked
					</DropdownMenuV2.ItemHelpText>
				</DropdownMenuV2.RadioItem>
			</DropdownMenuV2.Group>
		</DropdownMenuV2>
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
export const WithModals: StoryFn< typeof DropdownMenuV2 > = ( props ) => {
	const [ isOuterModalOpen, setOuterModalOpen ] = useState( false );
	const [ isInnerModalOpen, setInnerModalOpen ] = useState( false );

	const cx = useCx();
	const modalOverlayClassName = cx( modalOnTopOfDropdown );

	return (
		<>
			<DropdownMenuV2 { ...props }>
				<DropdownMenuV2.Item
					onClick={ () => setOuterModalOpen( true ) }
					hideOnClick={ false }
				>
					<DropdownMenuV2.ItemLabel>
						Open outer modal
					</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
				<DropdownMenuV2.Item
					onClick={ () => setInnerModalOpen( true ) }
					hideOnClick={ false }
				>
					<DropdownMenuV2.ItemLabel>
						Open inner modal
					</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
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
			</DropdownMenuV2>
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
	const dropdownMenuContext = useContext( DropdownMenuV2.Context );

	// Forwarding the content of the slot so that it can be used by the fill
	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[
					DropdownMenuV2.Context.Provider,
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

export const WithSlotFill: StoryFn< typeof DropdownMenuV2 > = ( props ) => {
	return (
		<SlotFillProvider>
			<DropdownMenuV2 { ...props }>
				<DropdownMenuV2.Item>
					<DropdownMenuV2.ItemLabel>Item</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
				<Slot />
			</DropdownMenuV2>

			<Fill>
				<DropdownMenuV2.Item>
					<DropdownMenuV2.ItemLabel>
						Item from fill
					</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
				<DropdownMenuV2
					trigger={
						<DropdownMenuV2.Item>
							<DropdownMenuV2.ItemLabel>
								Submenu from fill
							</DropdownMenuV2.ItemLabel>
						</DropdownMenuV2.Item>
					}
				>
					<DropdownMenuV2.Item>
						<DropdownMenuV2.ItemLabel>
							Submenu item from fill
						</DropdownMenuV2.ItemLabel>
					</DropdownMenuV2.Item>
				</DropdownMenuV2>
			</Fill>
		</SlotFillProvider>
	);
};
WithSlotFill.args = {
	...Default.args,
};

const toolbarVariantContextValue = {
	DropdownMenuV2: {
		variant: 'toolbar',
	},
};
export const ToolbarVariant: StoryFn< typeof DropdownMenuV2 > = ( props ) => (
	// TODO: add toolbar
	<ContextSystemProvider value={ toolbarVariantContextValue }>
		<DropdownMenuV2 { ...props }>
			<DropdownMenuV2.Item>
				<DropdownMenuV2.ItemLabel>
					Level 1 item
				</DropdownMenuV2.ItemLabel>
			</DropdownMenuV2.Item>
			<DropdownMenuV2.Item>
				<DropdownMenuV2.ItemLabel>
					Level 1 item
				</DropdownMenuV2.ItemLabel>
			</DropdownMenuV2.Item>
			<DropdownMenuV2.Separator />
			<DropdownMenuV2
				trigger={
					<DropdownMenuV2.Item>
						<DropdownMenuV2.ItemLabel>
							Submenu trigger
						</DropdownMenuV2.ItemLabel>
					</DropdownMenuV2.Item>
				}
			>
				<DropdownMenuV2.Item>
					<DropdownMenuV2.ItemLabel>
						Level 2 item
					</DropdownMenuV2.ItemLabel>
				</DropdownMenuV2.Item>
			</DropdownMenuV2>
		</DropdownMenuV2>
	</ContextSystemProvider>
);
ToolbarVariant.args = {
	...Default.args,
};

export const InsideModal: StoryFn< typeof DropdownMenuV2 > = ( props ) => {
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
					<DropdownMenuV2 { ...props }>
						<DropdownMenuV2.Item>
							<DropdownMenuV2.ItemLabel>
								Level 1 item
							</DropdownMenuV2.ItemLabel>
						</DropdownMenuV2.Item>
						<DropdownMenuV2.Item>
							<DropdownMenuV2.ItemLabel>
								Level 1 item
							</DropdownMenuV2.ItemLabel>
						</DropdownMenuV2.Item>
						<DropdownMenuV2.Separator />
						<DropdownMenuV2
							trigger={
								<DropdownMenuV2.Item>
									<DropdownMenuV2.ItemLabel>
										Submenu trigger
									</DropdownMenuV2.ItemLabel>
								</DropdownMenuV2.Item>
							}
						>
							<DropdownMenuV2.Item>
								<DropdownMenuV2.ItemLabel>
									Level 2 item
								</DropdownMenuV2.ItemLabel>
							</DropdownMenuV2.Item>
						</DropdownMenuV2>
					</DropdownMenuV2>
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
