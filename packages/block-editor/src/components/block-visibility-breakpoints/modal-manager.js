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

export function openBreakpointsModal( clientIds ) {
	openModalClientIds = clientIds;
	listeners.forEach( ( listener ) => listener() );
}

export function closeBreakpointsModal() {
	openModalClientIds = null;
	listeners.forEach( ( listener ) => listener() );
}

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
			{ ( fillProps ) => (
				<BlockVisibilityBreakpointsModal
					clientIds={ clientIds }
					onClose={ closeBreakpointsModal }
				/>
			) }
		</BlockVisibilityBreakpointsModalSlot>
	);
}

