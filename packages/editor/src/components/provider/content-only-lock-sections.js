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
import { unlock } from '../../lock-unlock';

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
			getClientIdsOfDescendants,
			getClientIdsWithDescendants,
			getSectionRootClientId,
			getSectionClientIds,
		} = unlock( select( blockEditorStore ) );

		const sectionRootClientId = getSectionRootClientId();
		const sectionClientIds = getSectionClientIds();
		const allClientIds = sectionRootClientId
			? getClientIdsOfDescendants( sectionRootClientId )
			: getClientIdsWithDescendants();
		return {
			sectionRootClientId,
			sectionClientIds,
			allClientIds,
		};
	}, [] );
	const { sectionClientIds, allClientIds, sectionRootClientId } = selected;
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
			// 1. The section root should hide non-content controls.
			setBlockEditingMode( sectionRootClientId, 'contentOnly' );

			// 2. Each section should hide non-content controls.
			for ( const clientId of sectionClientIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}

			// 3. The children of the section should be disabled.
			for ( const clientId of sectionChildrenClientIds ) {
				setBlockEditingMode( clientId, 'disabled' );
			}

			// 4. ...except for the "content" blocks which should be content-only.
			for ( const clientId of contentClientIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of [
					sectionRootClientId,
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
		sectionRootClientId,
		sectionClientIds,
		setBlockEditingMode,
		unsetBlockEditingMode,
	] );

	return null;
}
