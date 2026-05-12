/**
 * External dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Modal, Popover, Button } from '@wordpress/components';
import * as Tooltip from '../../../packages/ui/src/tooltip';
import { WithWpCompatOverlaySlot } from '../../../packages/ui/src/utils/with-wp-compat-overlay-slot';

/**
 * Demonstrates the cross-library stacking promise of the `@wordpress/ui`
 * compat overlay slot: a `@wordpress/ui` `Tooltip` rendered inside a
 * `@wordpress/components` `Modal` (or `Popover`) reliably stacks above the
 * components-side overlay.
 *
 * The dormant baseline (no decorator) would show the Tooltip rendered
 * via the default portal — which sits at body level but at a z-index
 * that may or may not beat `@wordpress/components` overlays depending
 * on insertion order. Wrapping the story with
 * `WithWpCompatOverlaySlot` opts it into the slot, where the Tooltip
 * gets a guaranteed-on-top stacking position.
 *
 * Authored as `.jsx` (rather than `.tsx`) to match the convention in
 * `storybook/stories/playground/`. The storybook tsconfig doesn't
 * compile cross-package source imports, and TSX stories that pull
 * `packages/ui/src/...` deep paths trip TS6307. JSX sidesteps the
 * type-check entirely while Vite still resolves the imports at runtime.
 */
export default {
	title: 'Playground/WP Compat Overlay Slot',
	decorators: [ WithWpCompatOverlaySlot ],
	parameters: {
		sourceLink:
			'storybook/stories/playground/wp-compat-overlay-slot.story.jsx',
	},
};

function TooltipInsideModal() {
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
							<Tooltip.Trigger aria-label="Hover for tooltip">
								Hover me
							</Tooltip.Trigger>
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
}

function TooltipInsidePopover() {
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
				<Popover anchor={ anchor } onClose={ () => setIsOpen( false ) }>
					<div style={ { padding: '1rem', maxWidth: '20rem' } }>
						<p>
							The Tooltip below is from `@wordpress/ui`. Hover its
							trigger; the tooltip popup should render above this
							popover.
						</p>
						<Tooltip.Provider delay={ 0 }>
							<Tooltip.Root>
								<Tooltip.Trigger aria-label="Hover for tooltip">
									Hover me
								</Tooltip.Trigger>
								<Tooltip.Popup>
									@wordpress/ui Tooltip — should sit above the
									Popover
								</Tooltip.Popup>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
				</Popover>
			) }
		</>
	);
}

export const InsideComponentsModal = {
	name: 'Tooltip inside @wordpress/components Modal',
	render: () => <TooltipInsideModal />,
};

export const InsideComponentsPopover = {
	name: 'Tooltip inside @wordpress/components Popover',
	render: () => <TooltipInsidePopover />,
};
