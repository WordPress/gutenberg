/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { BlockIcon } from '@wordpress/block-editor';
import { CheckboxControl } from '@wordpress/components';

function BlockTypesChecklist( { blockTypes, value, onItemChange } ) {
	return (
		<ul className="edit-post-manage-blocks-modal__checklist">
			{ blockTypes.map( ( blockType ) => (
				<li
					key={ blockType.name }
					className="edit-post-manage-blocks-modal__checklist-item"
				>
					<CheckboxControl
						label={ (
							<Fragment>
								{ blockType.title }
								<BlockIcon icon={ blockType.icon } />
							</Fragment>
						) }
						checked={ value.includes( blockType.name ) }
						onChange={ partial( onItemChange, blockType.name ) }
					/>
				</li>
			) ) }
		</ul>
	);
}

export default BlockTypesChecklist;
