/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import BlockManager from '../block-manager';

export default function BlockVisibility() {
	const { showBlockTypes, hideBlockTypes } = unlock(
		useDispatch( editorStore )
	);

	const {
		blockTypes,
		allowedBlockTypes: _allowedBlockTypes,
		hiddenBlockTypes: _hiddenBlockTypes,
	} = useSelect( ( select ) => {
		return {
			blockTypes: select( blocksStore ).getBlockTypes(),
			allowedBlockTypes:
				select( editorStore ).getEditorSettings().allowedBlockTypes,
			hiddenBlockTypes:
				select( preferencesStore ).get( 'core', 'hiddenBlockTypes' ) ??
				[],
		};
	}, [] );

	const allowedBlockTypes = useMemo( () => {
		if ( _allowedBlockTypes === true ) {
			return blockTypes;
		}
		return blockTypes.filter( ( { name } ) => {
			return _allowedBlockTypes?.includes( name );
		} );
	}, [ _allowedBlockTypes, blockTypes ] );

	const filteredBlockTypes = allowedBlockTypes.filter(
		( blockType ) =>
			hasBlockSupport( blockType, 'inserter', true ) &&
			( ! blockType.parent ||
				blockType.parent.includes( 'core/post-content' ) )
	);

	// Some hidden blocks become unregistered
	// by removing for instance the plugin that registered them, yet
	// they're still remain as hidden by the user's action.
	// We consider "hidden", blocks which were hidden and
	// are still registered.
	const hiddenBlockTypes = _hiddenBlockTypes.filter( ( hiddenBlock ) => {
		return filteredBlockTypes.some(
			( registeredBlock ) => registeredBlock.name === hiddenBlock
		);
	} );

	const selectedBlockTypes = filteredBlockTypes.filter(
		( blockType ) => ! hiddenBlockTypes.includes( blockType.name )
	);

	const onChangeSelectedBlockTypes = ( newSelectedBlockTypes ) => {
		if ( selectedBlockTypes.length > newSelectedBlockTypes.length ) {
			const blockTypesToHide = selectedBlockTypes.filter(
				( blockType ) =>
					! newSelectedBlockTypes.find(
						( { name } ) => name === blockType.name
					)
			);
			hideBlockTypes( blockTypesToHide.map( ( { name } ) => name ) );
		} else if ( selectedBlockTypes.length < newSelectedBlockTypes.length ) {
			const blockTypesToShow = newSelectedBlockTypes.filter(
				( blockType ) =>
					! selectedBlockTypes.find(
						( { name } ) => name === blockType.name
					)
			);
			showBlockTypes( blockTypesToShow.map( ( { name } ) => name ) );
		}
	};

	return (
		<BlockManager
			blockTypes={ filteredBlockTypes }
			selectedBlockTypes={ selectedBlockTypes }
			onChange={ onChangeSelectedBlockTypes }
		/>
	);
}
