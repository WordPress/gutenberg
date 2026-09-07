import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from '@wordpress/element';
import * as Combobox from '../index';
import { Spinner } from '../../../../spinner';
import { Stack } from '../../../../stack';
import { VisuallyHidden } from '../../../../visually-hidden';
import {
	ITEMS,
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from './fixtures';

const meta: Meta< typeof Combobox.Root > = {
	title: 'Design System/Components/Form/Primitives/Combobox',
	component: Combobox.Root,
	subcomponents: {
		'Combobox.Trigger': Combobox.Trigger,
		'Combobox.Portal': Combobox.Portal,
		'Combobox.Positioner': Combobox.Positioner,
		'Combobox.Popup': Combobox.Popup,
		'Combobox.InputGroup': Combobox.InputGroup,
		'Combobox.Input': Combobox.Input,
		'Combobox.List': Combobox.List,
		'Combobox.ListBody': Combobox.ListBody,
		'Combobox.ListFooter': Combobox.ListFooter,
		'Combobox.Collection': Combobox.Collection,
		'Combobox.Group': Combobox.Group,
		'Combobox.GroupLabel': Combobox.GroupLabel,
		'Combobox.Item': Combobox.Item,
		'Combobox.Value': Combobox.Value,
		'Combobox.Chips': Combobox.Chips,
		'Combobox.ChipWithRemove': Combobox.ChipWithRemove,
		'Combobox.Empty': Combobox.Empty,
		'Combobox.Status': Combobox.Status,
		'Combobox.Clear': Combobox.Clear,
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Combobox.Root >;

const inputWrapperStyle = {
	padding:
		'var(--wpds-dimension-padding-sm) var(--wpds-dimension-padding-sm) var(--wpds-dimension-padding-xs)',
};

export const Default: Story = {
	args: {
		items: ITEMS,
		children: [
			<Combobox.Trigger aria-label="Fruit" key="trigger" />,
			<Combobox.Popup key="popup">
				<div style={ inputWrapperStyle }>
					<Combobox.Input aria-label="Search" placeholder="Search" />
				</div>
				<Combobox.Empty>No results found.</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: FixtureItem ) => (
								<Combobox.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</Combobox.Item>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>,
		],
	},
};

export const Compact: Story = {
	args: {
		defaultValue: ITEMS[ 0 ],
		items: ITEMS,
		children: [
			<Combobox.Trigger
				size="compact"
				aria-label="Fruit"
				key="trigger"
			/>,
			<Combobox.Popup key="popup">
				<div style={ inputWrapperStyle }>
					<Combobox.Input aria-label="Search" placeholder="Search" />
				</div>
				<Combobox.Empty>No results found.</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: FixtureItem ) => (
								<Combobox.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</Combobox.Item>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>,
		],
	},
};

/**
 * For certain multiple select use cases, it may be better to design a custom
 * selection state UI, rather than using a chip-based selection state UI like `SearchableChipSelect`.
 * In such cases, the selector UI can be detached and inlined into a modal dialog, for example.
 *
 * To do this, omit the `Popup` and enable the `inline` prop on the `Root`.
 */
export const DetachedInline: Story = {
	parameters: {
		// The input keeps focus and arrow keys move through the options, so
		// the scrollable list is reachable by keyboard.
		a11y: {
			config: {
				rules: [
					{ id: 'scrollable-region-focusable', enabled: false },
				],
			},
		},
	},
	args: {
		items: ITEMS,
		multiple: true,
		inline: true,
		// `inline` requires `open` so the input references the visible list
		// with `aria-controls`.
		open: true,
		children: [
			<Combobox.Input
				aria-label="Search items"
				placeholder="Search items"
				key="input"
			/>,
			<div
				style={ {
					minHeight: '200px',
					maxHeight: '200px',
					marginTop: 8,
					overflow: 'auto',
				} }
				key="div"
			>
				<Combobox.Empty>No results found.</Combobox.Empty>
				<Combobox.List>
					<Combobox.Collection>
						{ ( item: FixtureItem ) => (
							<Combobox.Item key={ item.value } value={ item }>
								{ item.label }
							</Combobox.Item>
						) }
					</Combobox.Collection>
				</Combobox.List>
			</div>,
		],
	},
};

export const Creatable: Story = {
	render: function Template( args ) {
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState( ITEMS[ 0 ] );
		const hasNoExactMatch =
			inputValue.length > 0 &&
			! ITEMS.some( ( item ) => item.label === inputValue.trim() );
		const creatableItem = {
			value: 'create',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
		};

		return (
			<Combobox.Root
				{ ...args }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( newValue, event ) => {
					const typedValue = newValue as FixtureItem;
					if ( typedValue.value === 'create' ) {
						// eslint-disable-next-line no-alert
						alert( 'Show dialog to create new item!' );
					} else {
						setValue( typedValue );
					}
					args.onValueChange?.( newValue, event );
				} }
				items={
					! inputValue || hasNoExactMatch
						? [ ...ITEMS, creatableItem ]
						: ITEMS
				}
			>
				<Combobox.Trigger aria-label="Fruit" />
				<Combobox.Popup>
					<div style={ inputWrapperStyle }>
						<Combobox.Input
							aria-label="Search"
							placeholder="Search"
						/>
					</div>
					<Combobox.Empty>No results found.</Combobox.Empty>
					<Combobox.List>
						<Combobox.ListBody>
							<Combobox.Collection>
								{ ( item: FixtureItem ) =>
									item.value !== creatableItem.value && (
										<Combobox.Item
											key={ item.value }
											value={ item }
										>
											{ item.label }
										</Combobox.Item>
									)
								}
							</Combobox.Collection>
						</Combobox.ListBody>
						<Combobox.ListFooter>
							<Combobox.Item
								variant="creatable"
								value={ creatableItem }
								key={ creatableItem.value }
							>
								{ creatableItem.label }
							</Combobox.Item>
						</Combobox.ListFooter>
					</Combobox.List>
				</Combobox.Popup>
			</Combobox.Root>
		);
	},
};

function getStatusChildren( {
	loading,
	count,
	visibleCount,
}: {
	loading: boolean;
	count: number;
	visibleCount: boolean;
} ) {
	if ( loading ) {
		return (
			<Stack direction="row" gap="sm" align="center">
				<Spinner />
				Loading…
			</Stack>
		);
	}

	if ( count === 0 ) {
		return null;
	}

	const message =
		count === 1 ? '1 result found.' : `${ count } results found.`;

	if ( visibleCount ) {
		return message;
	}

	return <VisuallyHidden>{ message }</VisuallyHidden>;
}

function AsyncStatus( {
	loading,
	visibleCount,
}: {
	loading: boolean;
	visibleCount: boolean;
} ) {
	const filteredItems = BaseCombobox.useFilteredItems< FixtureItem >();

	return (
		<Combobox.Status>
			{ getStatusChildren( {
				loading,
				count: filteredItems.length,
				visibleCount,
			} ) }
		</Combobox.Status>
	);
}

function AsyncItemsTemplate( {
	args,
	visibleCount,
}: {
	args: Story[ 'args' ];
	visibleCount: boolean;
} ) {
	const [ loading, setLoading ] = useState( false );
	const [ items, setItems ] = useState< FixtureItem[] >( [] );
	const [ value, setValue ] = useState< FixtureItem | undefined >();
	const [ open, setOpen ] = useState( false );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > >();

	return (
		<Combobox.Root
			{ ...args }
			items={ items }
			value={ value }
			open={ open }
			onValueChange={ ( newValue ) => {
				setValue(
					( newValue ?? undefined ) as FixtureItem | undefined
				);
			} }
			onOpenChange={ ( nextOpen ) => {
				setOpen( nextOpen );
				if ( ! nextOpen ) {
					clearTimeout( timeoutRef.current );
					return;
				}
				setLoading( true );
				setItems( [] );
				clearTimeout( timeoutRef.current );
				timeoutRef.current = setTimeout( () => {
					setItems( ITEMS );
					setValue( ( current ) => current ?? ITEMS[ 0 ] );
					setLoading( false );
				}, 500 );
			} }
		>
			<Combobox.Trigger aria-label="Fruit" />
			<Combobox.Popup>
				<div style={ inputWrapperStyle }>
					<Combobox.Input aria-label="Search" placeholder="Search" />
				</div>
				<AsyncStatus
					loading={ loading }
					visibleCount={ visibleCount }
				/>
				<Combobox.Empty>
					{ loading ? null : 'No results found.' }
				</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: FixtureItem ) => (
								<Combobox.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</Combobox.Item>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>
		</Combobox.Root>
	);
}

/**
 * Loads the item list asynchronously. Keep `Status` mounted. It shows
 * loading, then a visually hidden result count. Use `Empty` for no results.
 */
export const AsyncItems: Story = {
	render: function Template( args ) {
		return <AsyncItemsTemplate args={ args } visibleCount={ false } />;
	},
};

/**
 * Same async pattern as `AsyncItems`, with the result count visible in the
 * popup.
 */
export const AsyncItemsVisibleCount: Story = {
	render: function Template( args ) {
		return <AsyncItemsTemplate args={ args } visibleCount />;
	},
};

/**
 * For custom needs, a `Combobox.Trigger` can take a custom render function as its children,
 * while `Combobox.Item` can take arbitrary content as children.
 *
 * In this example, some extra information is added to each list item as an ARIA description.
 */
export const WithCustomTriggerAndItem: Story = {
	args: {
		items: ITEMS,
		defaultValue: ITEMS[ 0 ],
		children: [
			<Combobox.Trigger aria-label="Fruit" key="trigger">
				{ ( item: FixtureItem ) => (
					<span
						style={ {
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						} }
					>
						<img
							src={ `https://gravatar.com/avatar/?d=initials&name=${ item.value }` }
							alt=""
							width="20"
							style={ {
								borderRadius: '50%',
							} }
						/>

						{ item.label }
					</span>
				) }
			</Combobox.Trigger>,
			<Combobox.Popup key="popup">
				<div style={ inputWrapperStyle }>
					<Combobox.Input aria-label="Search" placeholder="Search" />
				</div>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: FixtureItem ) => (
								<Combobox.Item
									key={ item.value }
									value={ item }
									aria-describedby={ `description-${ item.value }` }
								>
									<div
										style={ {
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											flexGrow: 1,
										} }
									>
										<span>{ item.label }</span>
										<span
											id={ `description-${ item.value }` }
											aria-hidden="true"
										>
											99 in stock
										</span>
									</div>
								</Combobox.Item>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>,
		],
	},
};

/**
 * Options can be organized into labeled groups with `Combobox.Group`
 * and `Combobox.GroupLabel`.
 */
export const Grouped: Story = {
	args: {
		items: GROUPED_ITEMS,
		children: [
			<Combobox.Trigger aria-label="Fruit" key="trigger" />,
			<Combobox.Popup key="popup">
				<div style={ inputWrapperStyle }>
					<Combobox.Input aria-label="Search" placeholder="Search" />
				</div>
				<Combobox.Empty>No results found.</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( group: FixtureGroup ) => (
								<Combobox.Group
									key={ group.label }
									items={ group.items }
								>
									<Combobox.GroupLabel>
										{ group.label }
									</Combobox.GroupLabel>
									<Combobox.Collection>
										{ ( item: FixtureItem ) => (
											<Combobox.Item
												key={ item.value }
												value={ item }
											>
												{ item.label }
											</Combobox.Item>
										) }
									</Combobox.Collection>
								</Combobox.Group>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>,
		],
	},
};

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can create
 * situations where a popover renders below another popover, when you want it to be rendered above.
 *
 * The `--wp-ui-combobox-z-index` CSS variable controls the z-index of the
 * `Combobox` positioner. Override it either:
 *
 * - **Globally**, by setting the variable on `:root` or `body` (raises every
 *   `Combobox` popup in the page), or
 * - **Per instance**, by passing a `Combobox.Positioner` with a `style` (or
 *   `className`) to `Combobox.Popup`'s `positioner` prop.
 *
 * This story demonstrates the per-instance approach.
 */
export const WithCustomZIndex: Story = {
	name: 'With Custom z-index',
	args: {
		defaultValue: ITEMS[ 0 ],
		items: ITEMS,
		children: [
			<Combobox.Trigger aria-label="Fruit" key="trigger" />,
			<Combobox.Popup
				positioner={
					<Combobox.Positioner
						style={ {
							'--wp-ui-combobox-z-index': '9999',
						} }
					/>
				}
				key="popup"
			>
				<div style={ inputWrapperStyle }>
					<Combobox.Input aria-label="Search" placeholder="Search" />
				</div>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: FixtureItem ) => (
								<Combobox.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</Combobox.Item>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>,
		],
	},
};
