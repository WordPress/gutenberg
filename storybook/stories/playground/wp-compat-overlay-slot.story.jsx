import { Modal, Popover, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
	Autocomplete,
	Combobox,
	Select,
	SelectControl,
	Tooltip,
} from '@wordpress/ui';

import { WithWpCompatOverlaySlot } from './with-wp-compat-overlay-slot';

const selectItems = [
	{ value: 'option-1', label: 'Option 1' },
	{ value: 'option-2', label: 'Option 2' },
	{ value: 'option-3', label: 'Option 3' },
];

const autocompleteItems = [
	{ id: '1', value: 'Item 1' },
	{ id: '2', value: 'Item 2' },
	{ id: '3', value: 'Item 3' },
];

const inputWrapperStyle = {
	padding:
		'var(--wpds-dimension-padding-sm) var(--wpds-dimension-padding-sm) var(--wpds-dimension-padding-xs)',
};

// Cross-library stacking: `@wordpress/ui` overlays (`Tooltip`, `Select`,
// `Combobox`, `SelectControl`, `Autocomplete`) inside a
// `@wordpress/components` Modal / Popover should sit above the
// components-side overlay via the compat overlay slot.
export default {
	title: 'Playground/Debug fixtures/WP Compat Overlay Slot',
	decorators: [ WithWpCompatOverlaySlot ],
};

export const InsideComponentsModal = {
	name: 'Overlays inside @wordpress/components Modal',
	render: function Render() {
		const [ isOpen, setIsOpen ] = useState( false );
		return (
			<>
				<Button
					variant="primary"
					onClick={ () => setIsOpen( true ) }
					__next40pxDefaultSize
				>
					Open `@wordpress/components` Modal
				</Button>
				{ isOpen && (
					<Modal
						title="Modal from @wordpress/components"
						onRequestClose={ () => setIsOpen( false ) }
					>
						<p>
							The overlays below are from `@wordpress/ui`. Their
							popups should render above this modal, not behind
							it.
						</p>
						<Tooltip.Provider delay={ 0 }>
							<Tooltip.Root>
								<Tooltip.Trigger>Hover me</Tooltip.Trigger>
								<Tooltip.Popup>
									@wordpress/ui Tooltip — should sit above the
									Modal
								</Tooltip.Popup>
							</Tooltip.Root>
						</Tooltip.Provider>

						<div style={ { marginTop: '1rem' } }>
							<Select.Root items={ selectItems }>
								<Select.Trigger aria-label="Select primitive" />
								<Select.Popup>
									{ selectItems.map( ( item ) => (
										<Select.Item
											key={ item.value }
											value={ item }
										>
											{ item.label }
										</Select.Item>
									) ) }
								</Select.Popup>
							</Select.Root>
						</div>

						<div style={ { marginTop: '1rem' } }>
							<Combobox.Root
								defaultValue={ selectItems[ 0 ] }
								items={ selectItems }
							>
								<Combobox.Trigger aria-label="Combobox primitive" />
								<Combobox.Popup>
									<div style={ inputWrapperStyle }>
										<Combobox.Input placeholder="Search" />
									</div>
									<Combobox.Empty>
										No results found.
									</Combobox.Empty>
									<Combobox.List>
										<Combobox.ListBody>
											<Combobox.Collection>
												{ ( item ) => (
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
						</div>

						<div style={ { marginTop: '1rem' } }>
							<SelectControl
								label="SelectControl"
								items={ selectItems }
							/>
						</div>

						<div style={ { marginTop: '1rem' } }>
							<Autocomplete.Root items={ autocompleteItems }>
								<Autocomplete.Input
									placeholder="Search items"
									aria-label="Autocomplete primitive"
								/>
								<Autocomplete.Popup>
									<Autocomplete.Empty>
										No matching items.
									</Autocomplete.Empty>
									<Autocomplete.List>
										<Autocomplete.ListBody>
											<Autocomplete.Collection>
												{ ( item ) => (
													<Autocomplete.Item
														key={ item.id }
														value={ item }
													>
														{ item.value }
													</Autocomplete.Item>
												) }
											</Autocomplete.Collection>
										</Autocomplete.ListBody>
									</Autocomplete.List>
								</Autocomplete.Popup>
							</Autocomplete.Root>
						</div>
					</Modal>
				) }
			</>
		);
	},
};

export const InsideComponentsPopover = {
	name: 'Overlays inside @wordpress/components Popover',
	render: function Render() {
		const [ anchor, setAnchor ] = useState( null );
		const [ isOpen, setIsOpen ] = useState( false );
		return (
			<>
				<Button
					ref={ setAnchor }
					variant="primary"
					onClick={ () => setIsOpen( ( v ) => ! v ) }
					__next40pxDefaultSize
				>
					Toggle `@wordpress/components` Popover
				</Button>
				{ isOpen && anchor && (
					<Popover
						anchor={ anchor }
						onClose={ () => setIsOpen( false ) }
					>
						<div style={ { padding: '1rem', maxWidth: '20rem' } }>
							<p>
								The overlays below are from `@wordpress/ui`.
								Their popups should render above this popover.
							</p>
							<Tooltip.Provider delay={ 0 }>
								<Tooltip.Root>
									<Tooltip.Trigger>Hover me</Tooltip.Trigger>
									<Tooltip.Popup>
										@wordpress/ui Tooltip — should sit above
										the Popover
									</Tooltip.Popup>
								</Tooltip.Root>
							</Tooltip.Provider>

							<div style={ { marginTop: '1rem' } }>
								<Select.Root items={ selectItems }>
									<Select.Trigger aria-label="Select primitive" />
									<Select.Popup>
										{ selectItems.map( ( item ) => (
											<Select.Item
												key={ item.value }
												value={ item }
											>
												{ item.label }
											</Select.Item>
										) ) }
									</Select.Popup>
								</Select.Root>
							</div>

							<div style={ { marginTop: '1rem' } }>
								<Combobox.Root
									defaultValue={ selectItems[ 0 ] }
									items={ selectItems }
								>
									<Combobox.Trigger aria-label="Combobox primitive" />
									<Combobox.Popup>
										<div style={ inputWrapperStyle }>
											<Combobox.Input placeholder="Search" />
										</div>
										<Combobox.Empty>
											No results found.
										</Combobox.Empty>
										<Combobox.List>
											<Combobox.ListBody>
												<Combobox.Collection>
													{ ( item ) => (
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
							</div>

							<div style={ { marginTop: '1rem' } }>
								<SelectControl
									label="SelectControl"
									items={ selectItems }
								/>
							</div>

							<div style={ { marginTop: '1rem' } }>
								<Autocomplete.Root items={ autocompleteItems }>
									<Autocomplete.Input
										placeholder="Search items"
										aria-label="Autocomplete primitive"
									/>
									<Autocomplete.Popup>
										<Autocomplete.Empty>
											No matching items.
										</Autocomplete.Empty>
										<Autocomplete.List>
											<Autocomplete.ListBody>
												<Autocomplete.Collection>
													{ ( item ) => (
														<Autocomplete.Item
															key={ item.id }
															value={ item }
														>
															{ item.value }
														</Autocomplete.Item>
													) }
												</Autocomplete.Collection>
											</Autocomplete.ListBody>
										</Autocomplete.List>
									</Autocomplete.Popup>
								</Autocomplete.Root>
							</div>
						</div>
					</Popover>
				) }
			</>
		);
	},
};
