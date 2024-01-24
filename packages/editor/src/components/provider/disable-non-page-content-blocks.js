/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useBlockEditingMode,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PAGE_CONTENT_BLOCK_TYPES } from './constants';

function DisableBlock( { clientId } ) {
	const isDescendentOfQueryLoop = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			return (
				getBlockParentsByBlockName( clientId, 'core/query' ).length !==
				0
			);
		},
		[ clientId ]
	);
	const mode = isDescendentOfQueryLoop ? undefined : 'contentOnly';
	const { setBlockEditingMode, unsetBlockEditingMode } =
		useDispatch( blockEditorStore );
	useEffect( () => {
		if ( mode ) {
			setBlockEditingMode( clientId, mode );
			return () => {
				unsetBlockEditingMode( clientId );
			};
		}
	}, [ clientId, mode, setBlockEditingMode, unsetBlockEditingMode ] );
}

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	useBlockEditingMode( 'disabled' );
	const clientIds = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlocksByName(
			PAGE_CONTENT_BLOCK_TYPES
		);
	}, [] );

	return clientIds.map( ( clientId ) => {
		return <DisableBlock key={ clientId } clientId={ clientId } />;
	} );
}
