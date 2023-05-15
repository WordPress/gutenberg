/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function useBlockEditingMode( clientId, mode ) {
	const blockEditingMode = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getBlockEditingMode(
				clientId
			),
		[ clientId ]
	);
	const { setBlockEditingMode, unsetBlockEditingMode } = unlock(
		useDispatch( blockEditorStore )
	);
	useEffect( () => {
		if ( mode ) {
			setBlockEditingMode( clientId, mode );
		}
		return () => {
			if ( mode ) {
				unsetBlockEditingMode( clientId );
			}
		};
	}, [ clientId, mode, setBlockEditingMode, unsetBlockEditingMode ] );
	return blockEditingMode;
}
