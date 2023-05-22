/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { BlockListBlockContext } from '../block-list/block';

export function useBlockEditingMode( mode ) {
	const { clientId } = useContext( BlockListBlockContext );
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
	}, [ clientId, mode ] );
	return blockEditingMode;
}
