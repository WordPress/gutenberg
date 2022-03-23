/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function BlockTypesChecklist( { blockTypes, value, onItemChange } ) {
	return (
		<ul className="block-editor-block-manager__checklist">
			{ blockTypes.map( ( blockType ) => (
				<li
					key={ blockType.name }
					className="block-editor-block-manager__checklist-item"
				>
					<CheckboxControl
						label={
							<>
								{ blockType.title }
								<BlockIcon icon={ blockType.icon } />
							</>
						}
						checked={ value.includes( blockType.name ) }
						onChange={ partial( onItemChange, blockType.name ) }
					/>
				</li>
			) ) }
		</ul>
	);
}

export default BlockTypesChecklist;
