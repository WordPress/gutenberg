/**
 * WordPress dependencies
 */
import { Modal, Popover, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as Tooltip from '../../../packages/ui/src/tooltip';
import { WithWpCompatOverlaySlot } from './with-wp-compat-overlay-slot';

/**
 * Cross-library stacking: a `@wordpress/ui` `Tooltip` rendered inside a
 * `@wordpress/components` `Modal` (or `Popover`) reliably sits above the
 * components-side overlay, via the `@wordpress/ui` compat overlay slot.
 */
export default {
	title: 'Playground/Debug fixtures/WP Compat Overlay Slot',
	decorators: [ WithWpCompatOverlaySlot ],
};

export const InsideComponentsModal = {
	name: 'Tooltip inside @wordpress/components Modal',
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
							The Tooltip below is from `@wordpress/ui`. Hover its
							trigger; the tooltip popup should render above this
							modal, not behind it.
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
					</Modal>
				) }
			</>
		);
	},
};

export const InsideComponentsPopover = {
	name: 'Tooltip inside @wordpress/components Popover',
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
								The Tooltip below is from `@wordpress/ui`. Hover
								its trigger; the tooltip popup should render
								above this popover.
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
						</div>
					</Popover>
				) }
			</>
		);
	},
};
