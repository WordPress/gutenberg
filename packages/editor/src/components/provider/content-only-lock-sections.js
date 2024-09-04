/**
 * WordPress dependencies
 */
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Component that when rendered, makes it so that the editor allows only
 * specific sections to be edited in content-only mode for templates.
 */
export default function ContentOnlyLockSections() {
	const registry = useRegistry();

	const { setBlockEditingMode, unsetBlockEditingMode } =
		useDispatch( blockEditorStore );

	const selected = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getClientIdsOfDescendants,
			getClientIdsWithDescendants,
		} = select( blockEditorStore );
		const { getEditorSettings } = select( editorStore );
		const { sectionRootClientId } = getEditorSettings();
		const sectionClientIds = getBlockOrder( sectionRootClientId );
		const allClientIds = sectionRootClientId
			? getClientIdsOfDescendants( sectionRootClientId )
			: getClientIdsWithDescendants();
		return {
			sectionClientIds,
			allClientIds,
		};
	}, [] );
	const { sectionClientIds, allClientIds } = selected;
	const { getBlockOrder, getBlockName } = useSelect( blockEditorStore );
	const { __experimentalHasContentRoleAttribute } = useSelect( blocksStore );

	useEffect( () => {
		const sectionChildrenClientIds = sectionClientIds.flatMap(
			( clientId ) => getBlockOrder( clientId )
		);
		const contentClientIds = allClientIds.filter( ( clientId ) =>
			__experimentalHasContentRoleAttribute( getBlockName( clientId ) )
		);

		registry.batch( () => {
			for ( const clientId of sectionClientIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
			for ( const clientId of sectionChildrenClientIds ) {
				setBlockEditingMode( clientId, 'disabled' );
			}
			for ( const clientId of contentClientIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of [
					...sectionClientIds,
					...sectionChildrenClientIds,
					...contentClientIds,
				] ) {
					unsetBlockEditingMode( clientId );
				}
			} );
		};
	}, [
		__experimentalHasContentRoleAttribute,
		allClientIds,
		getBlockName,
		getBlockOrder,
		registry,
		sectionClientIds,
		setBlockEditingMode,
		unsetBlockEditingMode,
	] );

	return null;
}
