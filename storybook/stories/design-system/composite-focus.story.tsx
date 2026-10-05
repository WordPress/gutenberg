import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from '@wordpress/element';
import { Autocomplete, Button, Combobox, Menu, Select } from '@wordpress/ui';
import styles from './composite-focus.module.scss';

type ComparisonArgs = {
	component: 'menu' | 'select' | 'combobox' | 'autocomplete';
	virtualIndicator: 'ring' | 'marker';
};

const ITEMS = [
	{
		value: 'editor',
		label: 'Editor tasks',
		description: 'Plan the next release.',
	},
	{ value: 'polish', label: 'Polish', description: 'Refine the details.' },
	{
		value: 'roadmap',
		label: 'Roadmap',
		description: 'Review upcoming work.',
	},
];

function Comparison( { component, virtualIndicator }: ComparisonArgs ) {
	const [ keyboard, setKeyboard ] = useState( false );

	// Story-only modality tracking includes portaled popups. Virtual focus
	// cannot use :focus-visible because DOM focus stays on the input.
	useEffect( () => {
		const onKeyDown = ( event: KeyboardEvent ) => {
			if (
				! [ 'Shift', 'Control', 'Alt', 'Meta' ].includes( event.key )
			) {
				setKeyboard( true );
			}
		};
		const onPointer = () => setKeyboard( false );
		document.addEventListener( 'keydown', onKeyDown, true );
		document.addEventListener( 'pointerdown', onPointer, true );
		document.addEventListener( 'pointermove', onPointer, true );
		return () => {
			document.removeEventListener( 'keydown', onKeyDown, true );
			document.removeEventListener( 'pointerdown', onPointer, true );
			document.removeEventListener( 'pointermove', onPointer, true );
		};
	}, [] );

	return (
		<div className={ styles.comparison }>
			<p>
				Design exploration for #80405. Hover to compare backgrounds. Use
				Tab and arrow keys to compare keyboard indicators. Rings use no
				background highlight. Change the Storybook theme to check both
				treatments with other colors.
			</p>
			{ ( component === 'combobox' || component === 'autocomplete' ) && (
				<p>
					The input keeps its focus ring. Use the virtualIndicator
					control to compare a second ring with a side marker on the
					active option. The marker keeps the background highlight.
					Checkmarks indicate selected values.
				</p>
			) }
			<div className={ styles.columns }>
				{ ( [ 'neutral', 'brand' ] as const ).map( ( tone ) => {
					const popupProps = {
						className: `${ styles.popup } ${ styles[ tone ] }`,
						'data-keyboard': keyboard,
						'data-indicator':
							component === 'menu' || component === 'select'
								? 'ring'
								: virtualIndicator,
					};
					return (
						<section key={ tone }>
							<h2>
								{ tone === 'neutral' ? 'Neutral' : 'Brand' }
							</h2>
							{ component === 'menu' && (
								<MenuExample
									tone={ tone }
									popupProps={ popupProps }
								/>
							) }
							{ component === 'select' && (
								<Select.Root
									items={ ITEMS }
									defaultValue={ ITEMS[ 0 ] }
								>
									<Select.Trigger
										aria-label={ `${ tone } project` }
									/>
									<Select.Popup { ...popupProps }>
										{ ITEMS.map( ( item ) => (
											<Select.Item
												key={ item.value }
												value={ item }
											>
												<Select.ItemLabel>
													{ item.label }
												</Select.ItemLabel>
												<Select.ItemDescription
													className={
														styles.description
													}
												>
													{ item.description }
												</Select.ItemDescription>
											</Select.Item>
										) ) }
									</Select.Popup>
								</Select.Root>
							) }
							{ component === 'combobox' && (
								<Combobox.Root
									items={ ITEMS }
									multiple
									defaultValue={ [ ITEMS[ 0 ] ] }
								>
									<Combobox.Trigger
										aria-label={ `${ tone } projects` }
									/>
									<Combobox.Popup
										{ ...popupProps }
										aria-label={ `${ tone } projects` }
									>
										<div className={ styles.search }>
											<Combobox.Input
												aria-label={ `${ tone } filter projects` }
												placeholder="Filter projects"
											/>
										</div>
										<Combobox.Empty>
											No matching projects.
										</Combobox.Empty>
										<Combobox.List>
											<Combobox.ListBody>
												<Combobox.Collection>
													{ (
														item: ( typeof ITEMS )[ number ]
													) => (
														<Combobox.Item
															key={ item.value }
															value={ item }
														>
															<Combobox.ItemLabel>
																{ item.label }
															</Combobox.ItemLabel>
															<Combobox.ItemDescription
																className={
																	styles.description
																}
															>
																{
																	item.description
																}
															</Combobox.ItemDescription>
														</Combobox.Item>
													) }
												</Combobox.Collection>
											</Combobox.ListBody>
										</Combobox.List>
									</Combobox.Popup>
								</Combobox.Root>
							) }
							{ component === 'autocomplete' && (
								<Autocomplete.Root
									items={ ITEMS.map( ( item ) => ( {
										...item,
										value: item.label,
									} ) ) }
								>
									<Autocomplete.Input
										aria-label={ `${ tone } search projects` }
										placeholder="Search projects"
									/>
									<Autocomplete.Popup { ...popupProps }>
										<Autocomplete.Empty>
											No matching projects.
										</Autocomplete.Empty>
										<Autocomplete.List>
											<Autocomplete.ListBody>
												<Autocomplete.Collection>
													{ (
														item: ( typeof ITEMS )[ number ]
													) => (
														<Autocomplete.Item
															key={ item.value }
															value={ item }
														>
															<Autocomplete.ItemLabel>
																{ item.label }
															</Autocomplete.ItemLabel>
															<Autocomplete.ItemDescription
																className={
																	styles.description
																}
															>
																{
																	item.description
																}
															</Autocomplete.ItemDescription>
														</Autocomplete.Item>
													) }
												</Autocomplete.Collection>
											</Autocomplete.ListBody>
										</Autocomplete.List>
									</Autocomplete.Popup>
								</Autocomplete.Root>
							) }
						</section>
					);
				} ) }
			</div>
		</div>
	);
}

function MenuExample( {
	tone,
	popupProps,
}: {
	tone: string;
	popupProps: {
		className: string;
		'data-keyboard': boolean;
		'data-indicator': string;
	};
} ) {
	const [ checked, setChecked ] = useState( true );
	return (
		<Menu.Root>
			<Menu.Trigger render={ <Button variant="outline" /> }>
				{ tone } menu
			</Menu.Trigger>
			<Menu.Popup { ...popupProps }>
				<Menu.CheckboxItem
					checked={ checked }
					onCheckedChange={ setChecked }
					closeOnClick={ false }
				>
					<Menu.ItemLabel>Show completed tasks</Menu.ItemLabel>
					<Menu.ItemDescription className={ styles.description }>
						Keep finished work in the list.
					</Menu.ItemDescription>
				</Menu.CheckboxItem>
				{ ITEMS.map( ( item ) => (
					<Menu.Item key={ item.value }>
						<Menu.ItemLabel>{ item.label }</Menu.ItemLabel>
						<Menu.ItemDescription className={ styles.description }>
							{ item.description }
						</Menu.ItemDescription>
					</Menu.Item>
				) ) }
				<Menu.Item disabled>
					<Menu.ItemLabel>Unavailable project</Menu.ItemLabel>
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}

const meta = {
	title: 'Design System/Experiments/Composite focus',
	component: Comparison,
	args: { component: 'menu', virtualIndicator: 'marker' },
	argTypes: {
		component: { control: false, table: { disable: true } },
		virtualIndicator: { control: 'radio', options: [ 'marker', 'ring' ] },
	},
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Temporary focus-style comparison for #80405. These overrides are scoped to the examples and do not change component defaults.',
			},
		},
	},
} satisfies Meta< typeof Comparison >;

export default meta;
type Story = StoryObj< typeof meta >;

export const MenuComparison: Story = {
	argTypes: { virtualIndicator: { table: { disable: true } } },
};
export const SelectComparison: Story = {
	args: { component: 'select' },
	argTypes: { virtualIndicator: { table: { disable: true } } },
};
export const ComboboxComparison: Story = { args: { component: 'combobox' } };
export const AutocompleteComparison: Story = {
	args: { component: 'autocomplete' },
};
