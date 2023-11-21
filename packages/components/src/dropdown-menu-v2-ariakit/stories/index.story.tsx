/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { matchSorter } from 'match-sorter';
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';
import {
	useState,
	useMemo,
	useContext,
	// startTransition,
	forwardRef,
	useEffect,
	useId,
	useDeferredValue,
	createContext,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { COLORS, useCx } from '../../utils';
import {
	DropdownMenu,
	DropdownComboboxMenu,
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
		trigger: { control: { type: null } },
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
};
InsideModal.parameters = {
	docs: {
		source: { type: 'code' },
	},
};

// QUESTIONS
// - when to use select item RENDER as combobox, and when to do the other way around
// - how to make it work with Menu, MenuItem, checkboxes and radios (including keyboard navigation, submenus)
// - is it possible to pass items declaratively
// - does it make sense to keep this as a separate implementation specific to menu?

const people = [ 'Brad', 'Marin', 'Marco', 'Lena', 'Chad', 'Brooke', 'Andrew' ];

const DropdownMenuComboboxContext = createContext();
interface ComboboxItemProps extends Ariakit.SelectItemProps {
	children?: React.ReactNode;
}
const ComboboxItem = forwardRef< HTMLDivElement, ComboboxItemProps >(
	function ComboboxItem( props, ref ) {
		const matches = useContext( DropdownMenuComboboxContext );

		return matches.includes( props.value ) ? (
			// Here we're combining both SelectItem and ComboboxItem into the same
			// element. SelectItem adds the multi-selectable attributes to the element
			// (for example, aria-selected).
			<Ariakit.SelectItem
				ref={ ref }
				{ ...props }
				render={ <Ariakit.ComboboxItem render={ props.render } /> }
				style={ { display: 'flex' } }
			>
				<Ariakit.SelectItemCheck />
				{ props.children || props.value }
			</Ariakit.SelectItem>
		) : null;
	}
);

interface ComboboxProps extends Omit< Ariakit.ComboboxProps, 'onChange' > {
	searchValue?: string;
	onSearchValueChange?: ( value: string ) => void;
	defaultSearchValue?: string;
	selectedValues?: string[];
	onSelectedValuesChange?: ( values: string[] ) => void;
	defaultSelectedValues?: string[];
	children: React.ReactNode;
}

const Combobox = forwardRef< HTMLInputElement, ComboboxProps >(
	function Combobox( props, ref ) {
		const {
			defaultSearchValue,
			searchValue,
			onSearchValueChange,
			defaultSelectedValues,
			selectedValues,
			onSelectedValuesChange,
			children,
			// searchFunction,
			...comboboxProps
		} = props;

		const combobox = Ariakit.useComboboxStore();
		const select = Ariakit.useSelectStore( { combobox } );
		const selectValue = select.useState( 'value' );

		const deferredSearchValue = useDeferredValue( searchValue );

		// Expose searchFn prop and default to matchsorter
		const matches = useMemo( () => {
			return matchSorter( people, deferredSearchValue ?? '', {
				baseSort: ( a, b ) => ( a.index < b.index ? -1 : 1 ),
			} );
		}, [ deferredSearchValue ] );

		// Reset the combobox value whenever an item is checked or unchecked.
		useEffect( () => combobox.setValue( '' ), [ selectValue, combobox ] );

		const defaultInputId = useId();
		const inputId = comboboxProps.id || defaultInputId;

		return (
			<Ariakit.ComboboxProvider
				store={ combobox }
				value={ searchValue }
				setValue={ onSearchValueChange }
				defaultValue={ defaultSearchValue }
				resetValueOnHide
			>
				<Ariakit.SelectProvider
					store={ select }
					value={ selectedValues }
					setValue={ onSelectedValuesChange }
					defaultValue={ defaultSelectedValues }
				>
					<DropdownMenuComboboxContext.Provider value={ matches }>
						<Ariakit.Combobox
							ref={ ref }
							id={ inputId }
							{ ...comboboxProps }
							className={ comboboxProps.className }
						/>
						<Ariakit.ComboboxList
							className="popover"
							alwaysVisible
							render={ <Ariakit.SelectList /> }
						>
							{ children }
							{ ! matches.length && <div>No results found</div> }
						</Ariakit.ComboboxList>
					</DropdownMenuComboboxContext.Provider>
				</Ariakit.SelectProvider>
			</Ariakit.ComboboxProvider>
		);
	}
);

export const WithCombobox: StoryFn< typeof DropdownMenu > = ( props ) => {
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ values, setValues ] = useState< string[] >( [ 'Marco' ] );

	return (
		<DropdownMenu { ...props }>
			<DropdownMenuItem>Level 1 item</DropdownMenuItem>
			<DropdownComboboxMenu
				trigger={ <DropdownMenuItem>Submenu trigger</DropdownMenuItem> }
			>
				<Combobox
					label="Pick an author"
					placeholder="placeholder"
					searchValue={ searchValue }
					onSearchValueChange={ setSearchValue }
					selectedValues={ values }
					onSelectedValuesChange={ setValues }
				>
					{ people.map( ( matchValue, i ) => (
						<ComboboxItem
							key={ matchValue + i }
							value={ matchValue }
						/>
					) ) }
				</Combobox>
			</DropdownComboboxMenu>
		</DropdownMenu>
	);
};
WithCombobox.args = {
	...Default.args,
};
