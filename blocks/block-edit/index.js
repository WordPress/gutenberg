/**
 * Internal dependencies
 */
import { getBlockType } from '../api';
import { applyFilters } from '../hooks';

function BlockEdit( props ) {
	const { name, ...editProps } = props;
	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return null;
	}

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferencially as the render value for the block.
	let Edit;
	if ( blockType ) {
		Edit = blockType.edit || blockType.save;
	}

	const filteredElements = applyFilters( 'BlockEdit', { edit: <Edit key="edit" { ...editProps } />, fragments: [] }, props );

	if ( filteredElements.edit.type !== Edit ) {
		// eslint-disable-next-line no-console
		console.error( 'edit must be a ' + Edit.toString() );
	}

	return [ filteredElements.edit, ...filteredElements.fragments ];
}

export default BlockEdit;
