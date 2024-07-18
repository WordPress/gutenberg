/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { CheckboxControl } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import BlockTypesChecklist from './checklist';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function BlockManagerCategory( { title, blockTypes } ) {
	const instanceId = useInstanceId( BlockManagerCategory );
	const { allowedBlockTypes, hiddenBlockTypes } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { get } = select( preferencesStore );
		return {
			allowedBlockTypes: getEditorSettings().allowedBlockTypes,
			hiddenBlockTypes: get( 'core', 'hiddenBlockTypes' ),
		};
	}, [] );
	const filteredBlockTypes = useMemo( () => {
		if ( allowedBlockTypes === true ) {
			return blockTypes;
		}
		return blockTypes.filter( ( { name } ) => {
			return allowedBlockTypes?.includes( name );
		} );
	}, [ allowedBlockTypes, blockTypes ] );
	const { showBlockTypes, hideBlockTypes } = unlock(
		useDispatch( editorStore )
	);
	const toggleVisible = useCallback(
		( blockName, nextIsChecked ) => {
			if ( nextIsChecked ) {
				showBlockTypes( blockName );
			} else {
				hideBlockTypes( blockName );
			}
		},
		[ showBlockTypes, hideBlockTypes ]
	);
	const toggleAllVisible = useCallback(
		( nextIsChecked ) => {
			const blockNames = blockTypes.map( ( { name } ) => name );
			if ( nextIsChecked ) {
				showBlockTypes( blockNames );
			} else {
				hideBlockTypes( blockNames );
			}
		},
		[ blockTypes, showBlockTypes, hideBlockTypes ]
	);

	if ( ! filteredBlockTypes.length ) {
		return null;
	}

	const checkedBlockNames = filteredBlockTypes
		.map( ( { name } ) => name )
		.filter( ( type ) => ! ( hiddenBlockTypes ?? [] ).includes( type ) );

	const titleId = 'editor-block-manager__category-title-' + instanceId;

	const isAllChecked = checkedBlockNames.length === filteredBlockTypes.length;
	const isIndeterminate = ! isAllChecked && checkedBlockNames.length > 0;

	return (
		<div
			role="group"
			aria-labelledby={ titleId }
			className="editor-block-manager__category"
		>
			<CheckboxControl
				__nextHasNoMarginBottom
				checked={ isAllChecked }
				onChange={ toggleAllVisible }
				className="editor-block-manager__category-title"
				indeterminate={ isIndeterminate }
				label={ <span id={ titleId }>{ title }</span> }
			/>
			<BlockTypesChecklist
				blockTypes={ filteredBlockTypes }
				value={ checkedBlockNames }
				onItemChange={ toggleVisible }
			/>
		</div>
	);
}

export default BlockManagerCategory;
