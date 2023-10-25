/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';
import { useState, useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { COLORS, useCx } from '../../utils';
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuGroup,
	DropdownMenuGroupLabel,
	DropdownMenuSeparator,
	DropdownMenuContext,
	DropdownMenuRadioItem,
} from '..';
import Icon from '../../icon';
import Button from '../../button';
import Modal from '../../modal';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';
import { ContextSystemProvider } from '../../context';

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

const ItemHelpText = styled.span`
	font-size: 12px;
	color: ${ COLORS.gray[ '700' ] };

	/* when the immediate parent item is hovered / focused */
	[data-active-item] > * > &,
	/* when the parent item is a submenu trigger and the submenu is open */
	[aria-expanded='true'] > &,
	/* when the parent item is disabled */
	[aria-disabled='true'] > & {
		color: inherit;
	}
`;

export const Default: StoryFn< typeof DropdownMenu > = ( props ) => (
	<DropdownMenu { ...props }>
		<DropdownMenuItem>Default item</DropdownMenuItem>
		<DropdownMenuItem hideOnClick={ false }>
			<div
				style={ {
					display: 'inline-flex',
					flexDirection: 'column',
				} }
			>
				Other item
				<ItemHelpText>
					Won&apos;t close the menu when clicked
				</ItemHelpText>
			</div>
		</DropdownMenuItem>
		<DropdownMenuItem disabled>Disabled item</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuGroup>
			<DropdownMenuGroupLabel>Prefix and suffix</DropdownMenuGroupLabel>
			<DropdownMenuItem
				prefix={ <Icon icon={ wordpress } size={ 24 } /> }
			>
				With prefix
			</DropdownMenuItem>
			<DropdownMenuItem suffix={ <span>⌘S</span> }>
				With suffix
			</DropdownMenuItem>
			<DropdownMenuItem
				disabled
				prefix={ <Icon icon={ wordpress } size={ 24 } /> }
				suffix={ <span>⌥⌘T</span> }
			>
				Disabled with prefix and suffix
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
			trigger={ <DropdownMenuItem>Submenu trigger</DropdownMenuItem> }
		>
			<DropdownMenuItem>Level 2 item</DropdownMenuItem>
			<DropdownMenuItem>Level 2 item</DropdownMenuItem>
			<DropdownMenu
				trigger={ <DropdownMenuItem>Submenu trigger</DropdownMenuItem> }
			>
				<DropdownMenuItem>Level 3 item</DropdownMenuItem>
				<DropdownMenuItem>Level 3 item</DropdownMenuItem>
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
				<DropdownMenuGroupLabel>
					Individual, uncontrolled checkboxes
				</DropdownMenuGroupLabel>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-uncontrolled-a"
					value="a"
				>
					Checkbox item A (initially unchecked)
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-uncontrolled-b"
					value="b"
					defaultChecked
				>
					Checkbox item B (initially checked)
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuGroupLabel>
					Individual, controlled checkboxes
				</DropdownMenuGroupLabel>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-controlled-a"
					value="a"
					checked={ isAChecked }
					onChange={ ( e ) => setAChecked( e.target.checked ) }
				>
					Checkbox item A
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-individual-controlled-b"
					value="b"
					checked={ isBChecked }
					onChange={ ( e ) => setBChecked( e.target.checked ) }
				>
					Checkbox item B (initially checked)
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuGroupLabel>
					Multiple, uncontrolled checkboxes
				</DropdownMenuGroupLabel>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="a"
				>
					Checkbox item A (initially unchecked)
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-uncontrolled"
					value="b"
					defaultChecked
				>
					Checkbox item B (initially checked)
				</DropdownMenuCheckboxItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuGroupLabel>
					Multiple, controlled checkboxes
				</DropdownMenuGroupLabel>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-controlled"
					value="a"
					checked={ multipleCheckboxesValue.includes( 'a' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					Checkbox item A (initially unchecked)
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					name="checkbox-multiple-controlled"
					value="b"
					checked={ multipleCheckboxesValue.includes( 'b' ) }
					onChange={ onMultipleCheckboxesCheckedChange }
				>
					Checkbox item B (initially checked)
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
				<DropdownMenuGroupLabel>
					Uncontrolled radios
				</DropdownMenuGroupLabel>
				<DropdownMenuRadioItem name="radio-uncontrolled" value="one">
					Radio item 1
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem
					name="radio-uncontrolled"
					value="two"
					defaultChecked
				>
					Radio item 2 (initially checked)
				</DropdownMenuRadioItem>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuGroupLabel>
					Controlled radios
				</DropdownMenuGroupLabel>
				<DropdownMenuRadioItem
					name="radio-controlled"
					value="one"
					checked={ radioValue === 'one' }
					onChange={ onRadioChange }
				>
					Radio item 1
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem
					name="radio-controlled"
					value="two"
					checked={ radioValue === 'two' }
					onChange={ onRadioChange }
				>
					Radio item 2 (initially checked)
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
					Open outer modal
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={ () => setInnerModalOpen( true ) }
					hideOnClick={ false }
				>
					Open inner modal
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

export const WithSlotFill: StoryFn< typeof DropdownMenu > = ( props ) => {
	return (
		<SlotFillProvider>
			<DropdownMenu { ...props }>
				<DropdownMenuItem>Item</DropdownMenuItem>
				<Slot />
			</DropdownMenu>

			<Fill>
				<DropdownMenuItem>Item from fill</DropdownMenuItem>
				<DropdownMenu
					trigger={
						<DropdownMenuItem>Submenu from fill</DropdownMenuItem>
					}
				>
					<DropdownMenuItem>Submenu item from fill</DropdownMenuItem>
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
	<ContextSystemProvider value={ toolbarVariantContextValue }>
		<DropdownMenu { ...props }>
			<DropdownMenuItem>Level 1 item</DropdownMenuItem>
			<DropdownMenuItem>Level 1 item</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenu
				trigger={ <DropdownMenuItem>Submenu trigger</DropdownMenuItem> }
			>
				<DropdownMenuItem>Level 2 item</DropdownMenuItem>
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
						<DropdownMenuItem>Level 1 item</DropdownMenuItem>
						<DropdownMenuItem>Level 1 item</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenu
							trigger={
								<DropdownMenuItem>
									Submenu trigger
								</DropdownMenuItem>
							}
						>
							<DropdownMenuItem>Level 2 item</DropdownMenuItem>
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
	hideOnEscape: ( e ) => {
		e.stopPropagation();
		return true;
	},
};
InsideModal.parameters = {
	docs: {
		source: { type: 'code' },
	},
};
