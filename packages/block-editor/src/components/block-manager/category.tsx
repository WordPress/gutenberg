import { useCallback } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { CheckboxControl as WCCheckboxControl } from '@wordpress/components';
import type { BlockType } from '@wordpress/blocks';
import BlockTypesChecklist from './checklist';
import type { BlockManagerCategoryProps } from './types';

function BlockManagerCategory( {
	title,
	blockTypes,
	selectedBlockTypes,
	onChange,
}: BlockManagerCategoryProps ) {
	const instanceId = useInstanceId( BlockManagerCategory );

	const toggleVisible = useCallback(
		( blockType: BlockType, nextIsChecked: boolean ) => {
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
		( nextIsChecked: boolean ) => {
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
			<WCCheckboxControl
				checked={ isAllChecked }
				onChange={ toggleAllVisible }
				className="block-editor-block-manager__category-title"
				indeterminate={ isIndeterminate }
				// The label renders as a node, so the title can carry its ID.
				label={
					(
						<span id={ titleId }>{ title }</span>
					 ) as unknown as string
				}
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
