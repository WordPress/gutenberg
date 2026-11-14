import { useCallback, useSyncExternalStore } from '@wordpress/element';
import { isEditConfig } from '../components/dataform-controls';
import { canFieldsUseUiOverlays } from '../field-types';
import {
	getUiOverlayContentOwners,
	subscribeToUiOverlaySupport,
} from '../utils/ui-overlay-compatibility';
import type { Field } from '../types';

const getServerSnapshot = () => false;

/**
 * Observe whether the actual field renderers can be hosted in WordPress UI overlays.
 * @param fields Field definitions used by the form.
 * @return Whether the form can be placed in a WordPress UI overlay.
 */
export function useUiOverlaySupport< Item >(
	fields: Field< Item >[]
): boolean {
	const subscribe = useCallback(
		( listener: () => void ) => {
			const owners: unknown[] = [];
			for ( const field of fields ) {
				owners.push( field.Edit, field.render );
				owners.push(
					...getUiOverlayContentOwners( field.header ),
					...getUiOverlayContentOwners( field.description )
				);
				if (
					isEditConfig( field.Edit ) &&
					field.Edit.control === 'text'
				) {
					owners.push( field.Edit.prefix, field.Edit.suffix );
				}
			}
			return subscribeToUiOverlaySupport( owners, listener );
		},
		[ fields ]
	);
	const getSnapshot = useCallback(
		() => canFieldsUseUiOverlays( fields ),
		[ fields ]
	);
	return useSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
}
