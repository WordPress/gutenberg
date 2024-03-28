/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../store';

export default function useZoomOutBlockEditingMode() {
	//const { clientId: rootClientId = '' } = useBlockEditContext();

	const { unsetBlockEditingMode, setBlockEditingMode } =
		useDispatch( blockEditorStore );

	const {
		isZoomOutMode,
		sectionsContainerClientId,
		sectionsClientIds,
		rootClientId,
	} = useSelect( ( select ) => {
		const { __unstableGetEditorMode, getClientIdsOfDescendants } =
			select( blockEditorStore );

		const { getSectionsContainerClientId } = select( editSiteStore );

		const postType = select( editorStore ).getCurrentPostType();

		const _sectionsContainerClientId =
			getSectionsContainerClientId( postType );

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
