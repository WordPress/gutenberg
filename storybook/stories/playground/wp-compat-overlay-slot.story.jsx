/**
 * WordPress dependencies
 */
import { Modal, Popover, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as Tooltip from '../../../packages/ui/src/tooltip';
import * as Select from '../../../packages/ui/src/form/primitives/select';
import { SelectControl } from '../../../packages/ui/src/form/select-control';
import { WithWpCompatOverlaySlot } from './with-wp-compat-overlay-slot';

const selectItems = [
	{ value: 'option-1', label: 'Option 1' },
	{ value: 'option-2', label: 'Option 2' },
	{ value: 'option-3', label: 'Option 3' },
];

// Cross-library stacking: `@wordpress/ui` overlays (`Tooltip`, `Select`,
// `SelectControl`) inside a `@wordpress/components` Modal / Popover
// should sit above the components-side overlay via the compat overlay
// slot.
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
				<Button variant="primary" onClick={ () => setIsOpen( true ) }>
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
							<SelectControl
								label="SelectControl"
								items={ selectItems }
							/>
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
								<SelectControl
									label="SelectControl"
									items={ selectItems }
								/>
							</div>
						</div>
					</Popover>
				) }
			</>
		);
	},
};
