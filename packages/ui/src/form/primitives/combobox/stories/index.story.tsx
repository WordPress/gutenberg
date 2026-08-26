import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from '@wordpress/element';
import * as Combobox from '../index';
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
		'Combobox.Clear': Combobox.Clear,
	},
	parameters: {
		// FIXME: The trigger has no visible label and relies on aria-label
		// (button-name).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
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
			<Combobox.Trigger key="trigger" />,
			<Combobox.Popup key="popup">
				<div style={ inputWrapperStyle }>
					<Combobox.Input placeholder="Search" />
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
			<Combobox.Trigger size="compact" key="trigger" />,
			<Combobox.Popup key="popup">
				<div style={ inputWrapperStyle }>
					<Combobox.Input placeholder="Search" />
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
			// Storybook merges parameters, so `test` must be set here to
			// override the warning-only default from `meta`.
			test: 'error',
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
				<Combobox.Trigger />
				<Combobox.Popup>
					<div style={ inputWrapperStyle }>
						<Combobox.Input placeholder="Search" />
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

export const AsyncItems: Story = {
	render: function Template( args ) {
		const LOADING_ITEM = {
			value: 'loading',
			label: 'Loading...',
		};
		const [ items, setItems ] = useState( [ LOADING_ITEM ] );
		const [ value, setValue ] = useState< unknown >( LOADING_ITEM );

		useEffect( () => {
			const timeout = setTimeout( () => {
				setItems( ITEMS );
				setValue( ITEMS[ 0 ] );
			}, 3000 );

			return () => clearTimeout( timeout );
		}, [] );

		return (
			<Combobox.Root
				{ ...args }
				items={ items }
				value={ value }
				onValueChange={ setValue }
			>
				<Combobox.Trigger />
				<Combobox.Popup>
					<div style={ inputWrapperStyle }>
						<Combobox.Input placeholder="Search" />
					</div>
					<Combobox.Empty>No results found.</Combobox.Empty>
					<Combobox.List>
						<Combobox.ListBody>
							<Combobox.Collection>
								{ ( item: FixtureItem ) => (
									<Combobox.Item
										key={ item.value }
										value={ item }
										disabled={ item.value === 'loading' }
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
			<Combobox.Trigger key="trigger">
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
					<Combobox.Input placeholder="Search" />
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
			<Combobox.Trigger key="trigger" />,
			<Combobox.Popup key="popup">
				<div style={ inputWrapperStyle }>
					<Combobox.Input placeholder="Search" />
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
			<Combobox.Trigger key="trigger" />,
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
					<Combobox.Input placeholder="Search" />
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
