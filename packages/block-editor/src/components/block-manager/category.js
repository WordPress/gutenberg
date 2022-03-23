/**
 * External dependencies
 */
import { includes, map, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockTypesChecklist from './checklist';
import useHiddenBlockTypes from './use-hidden-block-types';

function BlockManagerCategory( { scope, title, blockTypes } ) {
	const {
		hiddenBlockTypes,
		showBlockTypes,
		hideBlockTypes,
	} = useHiddenBlockTypes( scope );
	const instanceId = useInstanceId( BlockManagerCategory );
	const defaultAllowedBlockTypes = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			defaultAllowedBlockTypes:
				getSettings()?.defaultAllowedBlockTypes ?? [],
		};
	}, [] );
	const filteredBlockTypes = useMemo( () => {
		if ( defaultAllowedBlockTypes === true ) {
			return blockTypes;
		}
		return blockTypes.filter( ( { name } ) => {
			return includes( defaultAllowedBlockTypes || [], name );
		} );
	}, [ defaultAllowedBlockTypes, blockTypes ] );
	const toggleVisible = useCallback( ( blockName, nextIsChecked ) => {
		if ( nextIsChecked ) {
			showBlockTypes( blockName );
		} else {
			hideBlockTypes( blockName );
		}
	}, [] );
	const toggleAllVisible = useCallback(
		( nextIsChecked ) => {
			const blockNames = map( blockTypes, 'name' );
			if ( nextIsChecked ) {
				showBlockTypes( blockNames );
			} else {
				hideBlockTypes( blockNames );
			}
		},
		[ blockTypes ]
	);

	if ( ! filteredBlockTypes.length ) {
		return null;
	}

	const checkedBlockNames = without(
		map( filteredBlockTypes, 'name' ),
		...hiddenBlockTypes
	);

	const titleId = 'block-editor-block-manager__category-title-' + instanceId;

	const isAllChecked = checkedBlockNames.length === filteredBlockTypes.length;

	let ariaChecked;
	if ( isAllChecked ) {
		ariaChecked = 'true';
	} else if ( checkedBlockNames.length > 0 ) {
		ariaChecked = 'mixed';
	} else {
		ariaChecked = 'false';
	}

	return (
		<div
			role="group"
			aria-labelledby={ titleId }
			className="block-editor-block-manager__category"
		>
			<CheckboxControl
				checked={ isAllChecked }
				onChange={ toggleAllVisible }
				className="block-editor-block-manager__category-title"
				aria-checked={ ariaChecked }
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
