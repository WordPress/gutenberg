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

	const Component = blockType.edit;

	return <Component { ...props } />;
};

export default withFilters( 'editor.BlockEdit' )( Edit );
