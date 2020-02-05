/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { CheckboxControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

function BlockTypesChecklistItem( { blockType, onItemChange, value } ) {
	const { id, name, title } = blockType;
	const icon = useSelect(
		( select ) => {
			if ( id ) {
				let referencedBlockType;
				const {
					__experimentalGetParsedReusableBlock: getParsedReusableBlock,
				} = select( 'core/block-editor' );
				const referencedBlocks = getParsedReusableBlock( id );
				if ( referencedBlocks.length === 1 ) {
					referencedBlockType = getBlockType(
						referencedBlocks[ 0 ].name
					);
				}
				return referencedBlockType
					? referencedBlockType.icon
					: blockType.icon;
			}

			return blockType.icon;
		},
		[ id, blockType.icon ]
	);

	return (
		<li className="edit-post-manage-blocks-modal__checklist-item">
			<CheckboxControl
				label={
					<>
						{ title }
						<BlockIcon icon={ icon } />
					</>
				}
				checked={ value.includes( name ) }
				onChange={ partial( onItemChange, name ) }
			/>
		</li>
	);
}

function BlockTypesChecklist( { blockTypes, value, onItemChange } ) {
	return (
		<ul className="edit-post-manage-blocks-modal__checklist">
			{ blockTypes.map( ( blockType ) => (
				<BlockTypesChecklistItem
					key={ `${ blockType.name }/${ blockType.id }` }
					blockType={ blockType }
					onItemChange={ onItemChange }
					value={ value }
				/>
			) ) }
		</ul>
	);
}

export default BlockTypesChecklist;
