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
						__nextHasNoMarginBottom
						label={ blockType.title }
						checked={ value.includes( blockType.name ) }
						onChange={ ( ...args ) =>
							onItemChange( blockType, ...args )
						}
					/>
					<BlockIcon icon={ blockType.icon } />
				</li>
			) ) }
		</ul>
	);
}

export default BlockTypesChecklist;
