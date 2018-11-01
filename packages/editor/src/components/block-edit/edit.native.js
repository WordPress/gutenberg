/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

export const Edit = ( props ) => {
	const { attributes = {}, name } = props;
	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return null;
	}

	const style = props.style || attributes.style;
	const Component = blockType.edit;

	return (
		<Component
			{ ...omit( props, [ 'className' ] ) }
			style={ style }
		/>
	);
};

export default withFilters( 'editor.BlockEdit' )( Edit );
