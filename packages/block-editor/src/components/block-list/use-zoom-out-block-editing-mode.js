/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit/context';

export default function useZoomOutBlockEditingMode() {
	const { clientId: rootClientId = '' } = useBlockEditContext();

	const { unsetBlockEditingMode, setBlockEditingMode } =
		useDispatch( blockEditorStore );

	const { isZoomOutMode, sectionsContainerClientId, sectionsClientIds } =
		useSelect( ( select ) => {
			const {
				__unstableGetEditorMode,
				getSectionsContainerClientId,
				getClientIdsOfDescendants,
			} = select( blockEditorStore );

			const _sectionsContainerClientId = getSectionsContainerClientId();

			return {
				isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
				sectionsContainerClientId: _sectionsContainerClientId,
				sectionsClientIds: getClientIdsOfDescendants(
					_sectionsContainerClientId
				),
			};
		}, [] );

	useEffect( () => {
		if ( isZoomOutMode ) {
			setBlockEditingMode( rootClientId, 'disabled' );
			setBlockEditingMode( sectionsContainerClientId, 'contentOnly' );
			sectionsClientIds.forEach( ( clientId ) => {
				setBlockEditingMode( clientId, 'default' );
			} );

			return () => {
				sectionsClientIds.forEach( ( clientId ) => {
					unsetBlockEditingMode( clientId );
				} );
				unsetBlockEditingMode( sectionsContainerClientId );
				unsetBlockEditingMode( rootClientId );
			};
		}
	}, [
		isZoomOutMode,
		rootClientId,
		sectionsContainerClientId,
		sectionsClientIds,
		setBlockEditingMode,
		unsetBlockEditingMode,
	] );
}
