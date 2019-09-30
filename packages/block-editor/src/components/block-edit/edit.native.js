/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import CustomElement from '../custom-element';
import { isCustomElement } from '../../utils/dom';

export const Edit = ( props ) => {
	const { name } = props;
	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return null;
	}

	const Component = blockType.edit;

	if ( isCustomElement( Component ) ) {
		return <CustomElement { ...props } tagName={ Component } />;
	}

	return (
		<Component { ...props } />
	);
};

export default withFilters( 'editor.BlockEdit' )( Edit );
