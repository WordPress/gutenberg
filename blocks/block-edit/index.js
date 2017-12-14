/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getBlockType,
	getBlockDefaultClassname,
	hasBlockSupport,
} from '../api';

export function BlockEdit( props ) {
	const { name, attributes = {} } = props;
	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return null;
	}

	// Generate a class name for the block's editable form
	const generatedClassName = hasBlockSupport( blockType, 'className', true ) ?
		getBlockDefaultClassname( name ) :
		null;
	const className = classnames( generatedClassName, attributes.className );

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferencially as the render value for the block.
	const Edit = blockType.edit || blockType.save;

	return <Edit className={ className } { ...props } />;
}

export default withFilters( 'blocks.BlockEdit' )( BlockEdit );
