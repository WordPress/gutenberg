/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockEditingMode } from '../block-editing-mode';
import { store as blockEditorStore } from '../../store';

function EnableBlock( { clientId, mode = 'default' } ) {
	const { unsetBlockEditingMode, setBlockEditingMode } =
		useDispatch( blockEditorStore );
	useEffect( () => {
		setBlockEditingMode( clientId, mode );

		return () => {
			unsetBlockEditingMode( clientId );
		};
	}, [ mode, clientId, unsetBlockEditingMode, setBlockEditingMode ] );
}

function DisableNonMainBlocks() {
	useBlockEditingMode( 'disabled' );
	const { mainBlockClientId, clientIds } = useSelect( ( select ) => {
		const { getSectionsContainerClientId, getClientIdsOfDescendants } =
			select( blockEditorStore );
		return {
			clientIds: getClientIdsOfDescendants(
				getSectionsContainerClientId()
			),
			mainBlockClientId: getSectionsContainerClientId(),
		};
	}, [] );

	return (
		<>
			<EnableBlock clientId={ mainBlockClientId } mode="contentOnly" />
			{ clientIds.map( ( clientId ) => {
				return <EnableBlock key={ clientId } clientId={ clientId } />;
			} ) }
		</>
	);
}

export default function MaybeDisableNonMainBlocks() {
	const { isZoomOutMode } = useSelect( ( select ) => {
		const { __unstableGetEditorMode } = select( blockEditorStore );
		return {
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );

	if ( ! isZoomOutMode ) {
		return;
	}

	return <DisableNonMainBlocks />;
}
