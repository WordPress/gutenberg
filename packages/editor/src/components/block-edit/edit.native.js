/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

export const Edit = ( props ) => {
	const { name } = props;
	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return null;
	}

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferentially as the render value for the block.
	const Component = blockType.edit || blockType.save;

	return <Component { ...props } />;
};

export default withFilters( 'editor.BlockEdit' )( Edit );
