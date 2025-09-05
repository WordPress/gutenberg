/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTypesChecklist from './checklist';

function BlockManagerCategory( {
	title,
	blockTypes,
	selectedBlockTypes,
	onChange,
} ) {
	const instanceId = useInstanceId( BlockManagerCategory );

	const toggleVisible = useCallback(
		( blockType, nextIsChecked ) => {
			if ( nextIsChecked ) {
				onChange( [ ...selectedBlockTypes, blockType ] );
			} else {
				onChange(
					selectedBlockTypes.filter(
						( { name } ) => name !== blockType.name
					)
				);
			}
		},
		[ selectedBlockTypes, onChange ]
	);

	const toggleAllVisible = useCallback(
		( nextIsChecked ) => {
			if ( nextIsChecked ) {
				onChange( [
					...selectedBlockTypes,
					...blockTypes.filter(
						( blockType ) =>
							! selectedBlockTypes.find(
								( { name } ) => name === blockType.name
							)
					),
				] );
			} else {
				onChange(
					selectedBlockTypes.filter(
						( selectedBlockType ) =>
							! blockTypes.find(
								( { name } ) => name === selectedBlockType.name
							)
					)
				);
			}
		},
		[ blockTypes, selectedBlockTypes, onChange ]
	);

	if ( ! blockTypes.length ) {
		return null;
	}

	const checkedBlockNames = blockTypes
		.map( ( { name } ) => name )
		.filter( ( type ) =>
			( selectedBlockTypes ?? [] ).some(
				( selectedBlockType ) => selectedBlockType.name === type
			)
		);

	const titleId = 'block-editor-block-manager__category-title-' + instanceId;

	const isAllChecked = checkedBlockNames.length === blockTypes.length;
	const isIndeterminate = ! isAllChecked && checkedBlockNames.length > 0;

	return (
		<div
			role="group"
			aria-labelledby={ titleId }
			className="block-editor-block-manager__category"
		>
			<CheckboxControl
				__nextHasNoMarginBottom
				checked={ isAllChecked }
				onChange={ toggleAllVisible }
				className="block-editor-block-manager__category-title"
				indeterminate={ isIndeterminate }
				label={ <span id={ titleId }>{ title }</span> }
			/>
			<BlockTypesChecklist
				blockTypes={ blockTypes }
				value={ checkedBlockNames }
				onItemChange={ toggleVisible }
			/>
		</div>
	);
}

export default BlockManagerCategory;
