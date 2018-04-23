/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getBlockType,
	getBlockDefaultClassName,
	hasBlockSupport,
} from '../api';

export const Edit = ( props ) => {
	const { attributes = {}, isSelected, name } = props;
	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return null;
	}

	// Generate a class name for the block's editable form
	const generatedClassName = hasBlockSupport( blockType, 'className', true ) ?
		getBlockDefaultClassName( name ) :
		null;
	const className = classnames( generatedClassName, attributes.className );

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferentially as the render value for the block.
	const Component = blockType.edit || blockType.save;

	// For backwards compatibility concerns adds a focus and setFocus prop
	// These should be removed after some time (maybe when merging to Core)
	return (
		<Component
			{ ...props }
			className={ className }
			focus={ isSelected ? {} : false }
			setFocus={ noop }
		/>
	);
};

export default withFilters( 'blocks.BlockEdit' )( Edit );
