/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockVisibilityBreakpointsModalSlot } from './modal-slot';
import BlockVisibilityBreakpointsModal from './modal';

// Simple module-level state to track open modal
let openModalClientIds = null;
const listeners = new Set();

/**
 * Opens the breakpoints modal for the specified block client IDs.
 *
 * Uses module-level state to manage modal visibility across components.
 * Notifies all registered listeners of the state change.
 *
 * @param {string[]} clientIds Array of block client IDs to configure.
 */
export function openBreakpointsModal( clientIds ) {
	openModalClientIds = clientIds;
	listeners.forEach( ( listener ) => listener() );
}

/**
 * Closes the currently open breakpoints modal.
 *
 * Clears the module-level state and notifies all registered listeners.
 */
export function closeBreakpointsModal() {
	openModalClientIds = null;
	listeners.forEach( ( listener ) => listener() );
}

/**
 * Custom React hook to subscribe to breakpoints modal state changes.
 *
 * Returns the current client IDs if the modal is open, or null if closed.
 * Components using this hook will re-render when the modal state changes.
 *
 * @return {string[]|null} Array of client IDs if modal is open, or null if closed.
 */
export function useBreakpointsModalState() {
	const [ state, setState ] = useState( openModalClientIds );

	useEffect( () => {
		const listener = () => setState( openModalClientIds );
		listeners.add( listener );
		return () => listeners.delete( listener );
	}, [] );

	return state;
}

export default function BlockVisibilityBreakpointsModalManager() {
	const clientIds = useBreakpointsModalState();

	if ( ! clientIds ) {
		return null;
	}

	return (
		<BlockVisibilityBreakpointsModalSlot>
			{ () => (
				<BlockVisibilityBreakpointsModal
					clientIds={ clientIds }
					onClose={ closeBreakpointsModal }
				/>
			) }
		</BlockVisibilityBreakpointsModalSlot>
	);
}
